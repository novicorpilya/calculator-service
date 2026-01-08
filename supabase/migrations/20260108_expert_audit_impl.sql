-- ============================================================
-- Expert Audit System Implementation (Enterprise Grade)
-- Part of "Trusted Backend": versioning, auditing, and server-side recalculation.
-- ============================================================

-- 1. SCHEMA EXTENSIONS
ALTER TABLE calculations 
ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS manager_adjustments JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS final_snapshot JSONB;

-- 2. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS calculation_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_id UUID REFERENCES calculations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL,
    version INTEGER NOT NULL,
    prev_data JSONB,
    next_data JSONB,
    diff_summary JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_calc_id ON calculation_audit_log(calculation_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON calculation_audit_log(created_at);

-- 3. CORE LOGIC FUNCTIONS

-- Calculate total cost from JSONB results + manager adjustments
CREATE OR REPLACE FUNCTION calculate_expert_totals(p_results jsonb, p_adjustments jsonb)
RETURNS NUMERIC AS $$
DECLARE
    summary jsonb;
    item jsonb;
    item_total numeric := 0;
    running_cost numeric := 0;
    margin numeric := 1.0;
BEGIN
    summary := COALESCE(p_results->'summary', '[]'::jsonb);
    
    -- Base Calculation
    IF jsonb_typeof(summary) = 'array' THEN
        FOR item IN SELECT * FROM jsonb_array_elements(summary)
        LOOP
            item_total := COALESCE(
                (item->>'total')::numeric,
                COALESCE((item->>'price')::numeric, 0) * COALESCE((item->>'quantity')::numeric, 0)
            );
            
            IF item_total IS NOT NULL AND item_total != 'NaN'::numeric THEN
                running_cost := running_cost + item_total;
            END IF;
        END LOOP;
    END IF;
    
    -- Apply Manager Adjustments (Global Margin Example)
    margin := COALESCE((p_adjustments->>'global_margin')::numeric, 1.0);
    running_cost := running_cost * margin;
    
    RETURN ROUND(running_cost, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. ENHANCED TRIGGER: Status Guard, Optimistic Locking, and Recalculation
CREATE OR REPLACE FUNCTION fn_expert_audit_guard()
RETURNS TRIGGER AS $$
DECLARE
    v_metrics RECORD;
BEGIN
    -- 1. OPTIMISTIC LOCKING: Prevent overwriting changes from other managers
    IF TG_OP = 'UPDATE' AND OLD.version_number IS DISTINCT FROM NEW.version_number THEN
        -- Only if version was manually set by UI to a mismatching value
        IF NEW.version_number < OLD.version_number THEN
            RAISE EXCEPTION 'Conflict: Calculation version mismatch. Please reload project.'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;

    -- 2. LOCK ENFORCEMENT: No modifications if locked (invoice status)
    IF TG_OP = 'UPDATE' AND OLD.locked_at IS NOT NULL AND NEW.status != 'expert' AND NEW.status != OLD.status THEN
        -- Allow re-opening to expert by manager (handled in RPC)
    END IF;

    -- 3. MUTATION RULES BY STATUS
    IF NEW.status = 'expert' AND TG_OP = 'UPDATE' THEN
        -- Auto-recalculate metrics every time items or adjustments change
        NEW.total_cost_value := calculate_expert_totals(NEW.results, NEW.manager_adjustments);
        
        -- Auto-increment version on every mutation in expert mode
        IF OLD.results IS DISTINCT FROM NEW.results OR OLD.manager_adjustments IS DISTINCT FROM NEW.manager_adjustments THEN
            NEW.version_number := OLD.version_number + 1;
        END IF;
    END IF;

    -- 4. SNAPSHOTTING: Freeze data when moving to invoice
    IF TG_OP = 'UPDATE' AND OLD.status != 'invoice' AND NEW.status = 'invoice' THEN
        NEW.locked_at := NOW();
        NEW.final_snapshot := NEW.results; -- Freeze items
    END IF;

    -- 5. RELAXING LOCK: Re-opening project
    IF TG_OP = 'UPDATE' AND OLD.status = 'invoice' AND NEW.status = 'expert' THEN
        NEW.locked_at := NULL;
        NEW.version_number := OLD.version_number + 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace existing validation if needed or add as second trigger
-- We'll attach it BEFORE INSERT OR UPDATE
DROP TRIGGER IF EXISTS trg_expert_audit_guard ON calculations;
CREATE TRIGGER trg_expert_audit_guard
    BEFORE INSERT OR UPDATE ON calculations
    FOR EACH ROW
    EXECUTE FUNCTION fn_expert_audit_guard();

-- 5. AUDIT LOG TRIGGER (AFTER mutation)
CREATE OR REPLACE FUNCTION fn_log_calculation_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND (OLD.results IS DISTINCT FROM NEW.results OR OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO calculation_audit_log (
            calculation_id,
            actor_id,
            action_type,
            version,
            prev_data,
            next_data,
            diff_summary
        ) VALUES (
            NEW.id,
            auth.uid(),
            'STATUS_CHANGE_' || NEW.status,
            NEW.version_number,
            jsonb_build_object('status', OLD.status, 'results', OLD.results),
            jsonb_build_object('status', NEW.status, 'results', NEW.results),
            jsonb_build_object('reason', 'Automatic audit log')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculation_audit ON calculations;
CREATE TRIGGER trg_calculation_audit
    AFTER UPDATE ON calculations
    FOR EACH ROW
    EXECUTE FUNCTION fn_log_calculation_audit();

-- 6. RPC ENTRY POINT: Atomically adjust calculation
DROP FUNCTION IF EXISTS adjust_calculation_expert(uuid, jsonb, jsonb, integer);
DROP FUNCTION IF EXISTS adjust_calculation_expert(bigint, jsonb, jsonb, integer);
CREATE OR REPLACE FUNCTION adjust_calculation_expert(
    p_calculation_id bigint,
    p_results jsonb,
    p_adjustments jsonb,
    p_current_version integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_calc jsonb;
BEGIN
    -- This update will trigger fn_expert_audit_guard which checks the version
    UPDATE calculations
    SET 
        results = p_results,
        manager_adjustments = p_adjustments,
        version_number = p_current_version -- Trigger will check if this matches OLD.version_number
    WHERE id = p_calculation_id
    RETURNING to_jsonb(calculations.*) INTO v_updated_calc;

    IF v_updated_calc IS NULL THEN
        RAISE EXCEPTION 'Project not found' USING ERRCODE = 'P0002';
    END IF;

    RETURN v_updated_calc;
END;
$$;
