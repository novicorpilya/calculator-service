-- ============================================================
-- FIX: Missing project_number Column
-- Adds the project_number sequential column and auto-increment trigger.
-- ============================================================

-- 1. Create a sequence for the project numbering
CREATE SEQUENCE IF NOT EXISTS calculations_project_number_seq;

-- 2. Add the column
ALTER TABLE public.calculations 
ADD COLUMN IF NOT EXISTS project_number integer DEFAULT nextval('calculations_project_number_seq');

-- 3. Set existing rows to follow the sequence if needed (Optional, but good for consistency)
-- DO $$
-- DECLARE
--     r RECORD;
-- BEGIN
--     FOR r IN (SELECT id FROM calculations WHERE project_number IS NULL OR project_number = 0 ORDER BY created_at ASC) LOOP
--         UPDATE calculations SET project_number = nextval('calculations_project_number_seq') WHERE id = r.id;
--     END LOOP;
-- END $$;

-- 4. Trigger function to ensure project_number is assigned on INSERT
CREATE OR REPLACE FUNCTION fn_assign_project_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_number IS NULL THEN
        NEW.project_number := nextval('calculations_project_number_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach trigger
DROP TRIGGER IF EXISTS trg_assign_project_number ON calculations;
CREATE TRIGGER trg_assign_project_number
BEFORE INSERT ON calculations
FOR EACH ROW
EXECUTE FUNCTION fn_assign_project_number();
