-- ============================================================
-- ANALYTICS BACKFILL MIGRATION
-- Populates the order_items_summaries table with historical data
-- ============================================================

DO $$
DECLARE
    calc_record RECORD;
    item_record RECORD;
    v_item_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting analytics backfill...';

    -- 1. Get all calculations that are in a "finalized" or "official" status
    -- statuses: paid, processing, completed, ready, shipping, sent_to_warehouse
    FOR calc_record IN 
        SELECT id, user_id, venue_id, results, created_at
        FROM public.calculations 
        WHERE status IN ('paid', 'processing', 'completed', 'sent_to_warehouse', 'ready', 'shipping')
    LOOP
        -- Guard: results must exist and have a summary array
        IF calc_record.results IS NOT NULL AND calc_record.results ? 'summary' THEN
            
            -- Delete any existing summmaries for this calculation to avoid double-counting
            DELETE FROM public.order_items_summaries WHERE calculation_id = calc_record.id;

            -- 2. Extract items from the results JSONB summary array
            INSERT INTO public.order_items_summaries (
                calculation_id, user_id, venue_id, sku, category, 
                price_at_order, quantity, total_price, created_at
            )
            SELECT 
                calc_record.id, 
                calc_record.user_id, 
                calc_record.venue_id, 
                (item->>'sku'), 
                COALESCE(item->>'category', 'Other'), 
                (item->>'price')::numeric, 
                (item->>'quantity')::int,
                ((item->>'price')::numeric * (item->>'quantity')::int),
                calc_record.created_at -- Preserve the original creation date of the order
            FROM jsonb_array_elements(calc_record.results->'summary') AS item;

            v_item_count := v_item_count + 1;
        END IF;
    END LOOP;

    RAISE NOTICE 'Backfill completed. Processed % calculations.', v_item_count;
END $$;
