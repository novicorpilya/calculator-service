-- Purge legacy project statuses and unify data
-- This script migrates all projects with 'approved' or 'suppliers' status to 'invoice'
-- to align with the new streamlined commercial flow.

-- Update calculations status
UPDATE calculations 
SET status = 'invoice', updated_at = NOW()
WHERE status IN ('approved', 'suppliers');

COMMIT;
