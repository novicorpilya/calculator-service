-- ============================================================
-- ANALYTICS & SMART REORDER
-- Phase 3.1: Database Schema & Logic
-- Date: 2026-01-21
-- ============================================================

-- 1. Analytics Summary Table for fast querying
CREATE TABLE IF NOT EXISTS public.order_items_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_id UUID REFERENCES public.calculations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    venue_id UUID REFERENCES public.venues(id),
    sku TEXT,
    category TEXT,
    price_at_order NUMERIC,
    quantity INT,
    total_price NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_order_items_user_category ON public.order_items_summaries(user_id, category);
CREATE INDEX IF NOT EXISTS idx_order_items_venue ON public.order_items_summaries(venue_id);
CREATE INDEX IF NOT EXISTS idx_order_items_created ON public.order_items_summaries(created_at);

-- 2. Sync Trigger: Move items to analytics when project is "official"
CREATE OR REPLACE FUNCTION public.fn_sync_order_to_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync on payment confirmed or completion
    IF (NEW.status IN ('paid', 'processing', 'completed', 'sent_to_warehouse', 'ready', 'shipping') 
        AND (OLD.status IS DISTINCT FROM NEW.status)) THEN
        
        -- Clean up existing entries for this calculation to avoid duplicates
        DELETE FROM public.order_items_summaries WHERE calculation_id = NEW.id;
        
        -- Safe extract items from results JSONB
        IF (NEW.results IS NOT NULL AND NEW.results ? 'summary') THEN
            INSERT INTO public.order_items_summaries (calculation_id, user_id, venue_id, sku, category, price_at_order, quantity, total_price)
            SELECT 
                NEW.id, NEW.user_id, NEW.venue_id, 
                (item->>'sku'), 
                COALESCE(item->>'category', 'Other'), 
                (item->>'price')::numeric, 
                (item->>'quantity')::int,
                ((item->>'price')::numeric * (item->>'quantity')::int)
            FROM jsonb_array_elements(NEW.results->'summary') AS item;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_analytics ON public.calculations;
CREATE TRIGGER trg_sync_analytics 
    AFTER UPDATE ON public.calculations
    FOR EACH ROW EXECUTE FUNCTION public.fn_sync_order_to_analytics();

-- 3. Smart Reorder RPC: Clone with Price Updates
CREATE OR REPLACE FUNCTION public.apply_smart_reorder(source_calculation_id UUID)
RETURNS UUID AS $$
DECLARE
    new_id UUID := gen_random_uuid();
    v_user_id UUID;
    v_results JSONB;
    v_updated_results JSONB;
    v_current_item_count INT;
BEGIN
    -- Guard: Check if source exists
    SELECT user_id, results INTO v_user_id, v_results 
    FROM public.calculations WHERE id = source_calculation_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Source calculation not found';
    END IF;

    -- Update prices from inventory_items
    WITH updated_items AS (
        SELECT 
            item.val || jsonb_build_object(
                'price', COALESCE(inv.price, (item.val->>'price')::numeric),
                'is_price_changed', inv.price IS DISTINCT FROM (item.val->>'price')::numeric,
                'is_out_of_stock', COALESCE(inv.stock <= 0, false)
            ) as new_item
        FROM jsonb_array_elements(v_results->'summary') AS item(val)
        LEFT JOIN public.inventory_items inv ON inv.sku = item.val->>'sku'
    )
    SELECT 
        jsonb_build_object(
            'summary', jsonb_agg(new_item),
            'byZone', v_results->'byZone', -- Preserve zone structure but items inside might need update too in full version
            'totalGoods', SUM((new_item->>'price')::numeric * (new_item->>'quantity')::int),
            'grandTotal', SUM((new_item->>'price')::numeric * (new_item->>'quantity')::int) * 1.2
        ) INTO v_updated_results 
    FROM updated_items;

    -- Create new draft from clone
    INSERT INTO public.calculations (
        id, user_id, status, organization_name, results, 
        venue_id, type, total_area, zones_count, staff_count, 
        daily_visitors, sanitary_level, intensity_level, replacement_cycle
    )
    SELECT 
        new_id, v_user_id, 'draft', organization_name || ' (Повтор)', v_updated_results, 
        venue_id, type, total_area, zones_count, staff_count, 
        daily_visitors, sanitary_level, intensity_level, replacement_cycle
    FROM public.calculations WHERE id = source_calculation_id;

    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Analytics Aggregation RPC
CREATE OR REPLACE FUNCTION public.get_client_dashboard_stats(
    p_user_id UUID DEFAULT auth.uid(),
    p_venue_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_total_vol NUMERIC;
    v_order_count INT;
    v_avg_delivery NUMERIC;
    v_top_categories JSONB;
    v_monthly_spending JSONB;
BEGIN
    -- 1. Basic stats (Volume & Count)
    SELECT 
        COALESCE(SUM(total_cost_value), 0),
        COUNT(id)
    INTO v_total_vol, v_order_count
    FROM public.calculations 
    WHERE user_id = p_user_id 
      AND status IN ('paid', 'processing', 'completed', 'ready', 'shipping', 'sent_to_warehouse')
      AND (p_venue_id IS NULL OR venue_id = p_venue_id);

    -- 2. Real Delivery Time Calculation
    -- We calculate the average difference between the first 'paid' status and 'completed' status
    SELECT 
        ROUND(AVG(EXTRACT(EPOCH FROM (completed_time - paid_time)) / 86400)::numeric, 1)
    INTO v_avg_delivery
    FROM (
        SELECT 
            c.id,
            MIN(CASE WHEN v.snapshot_data->>'status' = 'paid' THEN v.created_at END) as paid_time,
            MAX(CASE WHEN v.snapshot_data->>'status' = 'completed' THEN v.created_at END) as completed_time
        FROM public.calculations c
        JOIN public.calculation_versions v ON v.calculation_id = c.id
        WHERE c.user_id = p_user_id 
          AND c.status = 'completed'
          AND (p_venue_id IS NULL OR c.venue_id = p_venue_id)
        GROUP BY c.id
    ) delivery_times
    WHERE paid_time IS NOT NULL AND completed_time IS NOT NULL;

    -- 3. Top categories from the analytics table
    SELECT jsonb_agg(cat_row) INTO v_top_categories
    FROM (
        SELECT category, SUM(total_price) as value, ROUND(100.0 * SUM(total_price) / NULLIF(v_total_vol, 0), 1) as percentage
        FROM public.order_items_summaries
        WHERE user_id = p_user_id
          AND (p_venue_id IS NULL OR venue_id = p_venue_id)
        GROUP BY category
        ORDER BY value DESC
        LIMIT 5
    ) cat_row;

    -- 4. Monthly spending trend (Last 12 months)
    SELECT jsonb_agg(month_row) INTO v_monthly_spending
    FROM (
        SELECT 
            CASE EXTRACT(MONTH FROM month)
                WHEN 1 THEN 'Янв'
                WHEN 2 THEN 'Фев'
                WHEN 3 THEN 'Мар'
                WHEN 4 THEN 'Апр'
                WHEN 5 THEN 'Май'
                WHEN 6 THEN 'Июн'
                WHEN 7 THEN 'Июл'
                WHEN 8 THEN 'Авг'
                WHEN 9 THEN 'Сен'
                WHEN 10 THEN 'Окт'
                WHEN 11 THEN 'Ноя'
                WHEN 12 THEN 'Дек'
            END as name,
            COALESCE(SUM(s.total_price), 0) as value
        FROM GENERATE_SERIES(
            DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
            DATE_TRUNC('month', CURRENT_DATE),
            INTERVAL '1 month'
        ) month
        LEFT JOIN public.order_items_summaries s ON 
            DATE_TRUNC('month', s.created_at) = month 
            AND s.user_id = p_user_id
            AND (p_venue_id IS NULL OR s.venue_id = p_venue_id)
        GROUP BY month
        ORDER BY month ASC
    ) month_row;

    RETURN jsonb_build_object(
        'totalVolume', v_total_vol,
        'orderCount', v_order_count,
        'avgDeliveryDays', COALESCE(v_avg_delivery, 0),
        'vipStatus', CASE WHEN v_total_vol > 500000 THEN 'VIP' ELSE 'Standard' END,
        'topCategories', COALESCE(v_top_categories, '[]'::jsonb),
        'monthlySpending', COALESCE(v_monthly_spending, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
