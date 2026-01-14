-- Cleanup duplicate triggers on calculations AND calculation_audit_log tables
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    -- 1. Remove Triggers from 'calculations'
    FOR r IN (
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'calculations' 
        AND trigger_schema = 'public'
    ) LOOP 
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.calculations'; 
    END LOOP; 

    -- 2. Remove Triggers from 'calculation_audit_log' (potential cause of double messages)
    FOR r IN (
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'calculation_audit_log' 
        AND trigger_schema = 'public'
    ) LOOP 
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.calculation_audit_log'; 
    END LOOP;
END $$;

-- Re-create the SINGLE correct trigger for audit logs (on calculations)
DROP TRIGGER IF EXISTS trg_calculation_audit_log ON public.calculations;
CREATE TRIGGER trg_calculation_audit_log
    AFTER INSERT OR UPDATE ON public.calculations
    FOR EACH ROW EXECUTE FUNCTION public.fn_log_calculation_change();
