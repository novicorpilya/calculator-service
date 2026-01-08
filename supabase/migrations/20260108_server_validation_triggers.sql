-- ============================================================
-- Server-Side Validation Triggers for Calculator Service
-- Implements "Trusted Backend" pattern - frontend calculations
-- are validated and recalculated on the server.
-- ============================================================

-- 1. FUNCTION: Calculate total cost from JSONB results
CREATE OR REPLACE FUNCTION calculate_results_metrics(results jsonb)
RETURNS TABLE(total_cost numeric, items_count integer) AS $$
DECLARE
    summary jsonb;
    item jsonb;
    item_total numeric := 0;
    running_cost numeric := 0;
    count integer := 0;
BEGIN
    summary := COALESCE(results->'summary', '[]'::jsonb);
    
    IF jsonb_typeof(summary) = 'array' THEN
        FOR item IN SELECT * FROM jsonb_array_elements(summary)
        LOOP
            -- Calculate item total: prefer 'total' field, else price * quantity
            item_total := COALESCE(
                (item->>'total')::numeric,
                COALESCE((item->>'price')::numeric, 0) * COALESCE((item->>'quantity')::numeric, 0)
            );
            
            -- Handle NaN/Infinity
            IF item_total IS NOT NULL AND item_total != 'NaN'::numeric THEN
                running_cost := running_cost + item_total;
            END IF;
            
            count := count + 1;
        END LOOP;
    END IF;
    
    total_cost := running_cost;
    items_count := count;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. FUNCTION: Validate status transitions (State Machine)
CREATE OR REPLACE FUNCTION validate_status_transition(
    old_status text,
    new_status text
) RETURNS boolean AS $$
DECLARE
    allowed_transitions jsonb := ''{
        "draft": ["sent"],
        "sent": ["expert", "changes", "invoice"],
        "expert": ["changes", "invoice"],
        "changes": ["revision", "sent"],
        "revision": ["expert", "invoice"],
        "invoice": ["payment_review", "changes"],
        "payment_review": ["paid", "changes"],
        "paid": ["processing"],
        "processing": ["ready"],
        "ready": ["shipping"],
        "shipping": ["completed"],
        "completed": ["closed"],
        "closed": []
    }''::jsonb;
    allowed_array jsonb;
BEGIN
    -- If status hasn't changed, always allow
    IF old_status = new_status THEN
        RETURN true;
    END IF;
    
    -- If old_status is null (INSERT), allow any initial status
    IF old_status IS NULL THEN
        RETURN true;
    END IF;
    
    -- Get allowed transitions for old_status
    allowed_array := allowed_transitions->old_status;
    
    -- If old_status not in map, deny transition
    IF allowed_array IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if new_status is in allowed array
    RETURN allowed_array ? new_status;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. TRIGGER FUNCTION: Auto-calculate metrics and validate on INSERT/UPDATE
CREATE OR REPLACE FUNCTION calculations_before_upsert()
RETURNS TRIGGER AS $$
DECLARE
    metrics record;
BEGIN
    -- Recalculate metrics from results JSONB
    IF NEW.results IS NOT NULL THEN
        SELECT * INTO metrics FROM calculate_results_metrics(NEW.results);
        NEW.total_cost_value := metrics.total_cost;
        NEW.total_items_count := metrics.items_count;
    END IF;
    
    -- Validate status transition (only on UPDATE if status is changing)
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        IF NOT validate_status_transition(OLD.status, NEW.status) THEN
            RAISE EXCEPTION 'Invalid status transition from "%" to "%"', OLD.status, NEW.status
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    
    -- Set updated_at timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_calculations_before_upsert ON calculations;

-- Create trigger
CREATE TRIGGER trg_calculations_before_upsert
    BEFORE INSERT OR UPDATE ON calculations
    FOR EACH ROW
    EXECUTE FUNCTION calculations_before_upsert();

-- 4. FUNCTION: Validate zone count matches zone_details array length
CREATE OR REPLACE FUNCTION validate_zones_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.zone_details IS NOT NULL THEN
        IF jsonb_typeof(NEW.zone_details) = 'array' THEN
            NEW.zones_count := jsonb_array_length(NEW.zone_details);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_validate_zones_count ON calculations;

-- Create trigger (runs before the main trigger)
CREATE TRIGGER trg_validate_zones_count
    BEFORE INSERT OR UPDATE OF zone_details ON calculations
    FOR EACH ROW
    EXECUTE FUNCTION validate_zones_count();

-- 5. Add CHECK constraint for valid statuses
DO $$
BEGIN
    -- Drop existing constraint if exists
    ALTER TABLE calculations DROP CONSTRAINT IF EXISTS chk_calculation_status;
    
    -- Create constraint with all valid statuses including legacy ones
    ALTER TABLE calculations 
    ADD CONSTRAINT chk_calculation_status 
    CHECK (status IN (
        ''draft'', ''sent'', ''expert'', ''changes'', ''revision'', 
        ''invoice'', ''payment_review'', ''paid'', ''processing'', 
        ''ready'', ''shipping'', ''completed'', ''closed''
    ));
END $$;

-- 6. COMMENT: Document the validation logic
COMMENT ON FUNCTION calculations_before_upsert() IS 
'Server-side validation trigger that:
1. Recalculates total_cost_value and total_items_count from results JSONB
2. Validates status transitions according to business rules
3. Updates the updated_at timestamp
This ensures backend is the source of truth, not frontend.';

-- ============================================================
-- VERIFICATION QUERIES (run manually to test)
-- ============================================================
-- Test invalid status transition (should fail):
-- UPDATE calculations SET status = 'invoice' WHERE status = 'draft';

-- Test that metrics are recalculated:
-- UPDATE calculations 
-- SET results = '{"summary": [{"price": 100, "quantity": 5}]}'::jsonb
-- WHERE id = 1;
-- SELECT total_cost_value, total_items_count FROM calculations WHERE id = 1;
-- Expected: total_cost_value = 500, total_items_count = 1
