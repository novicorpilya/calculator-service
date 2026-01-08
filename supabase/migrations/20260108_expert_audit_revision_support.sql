-- ============================================================
-- FIX: Support Expert Audit features in REVISION status
-- This ensures that calculations and versioning work for
-- "Правки внесены" as well as "На экспертизе".
-- ============================================================

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

    -- 2. LOCK ENFORCEMENT: (Already handled by status transitions)
    
    -- 3. MUTATION RULES BY STATUS
    -- Enable expert audit features for both 'expert' and 'revision' statuses
    IF NEW.status IN ('expert', 'revision') AND TG_OP = 'UPDATE' THEN
        -- Auto-recalculate metrics every time items or adjustments change
        NEW.total_cost_value := calculate_expert_totals(NEW.results, NEW.manager_adjustments);
        
        -- Auto-increment version on every mutation in these modes
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
    IF TG_OP = 'UPDATE' AND OLD.status = 'invoice' AND NEW.status IN ('expert', 'revision') THEN
        NEW.locked_at := NULL;
        NEW.version_number := OLD.version_number + 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
