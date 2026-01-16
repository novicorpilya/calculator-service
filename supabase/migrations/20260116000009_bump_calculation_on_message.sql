-- Function to update calculation updated_at timestamp
CREATE OR REPLACE FUNCTION bump_calculation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.calculation_id IS NOT NULL THEN
        UPDATE calculations
        SET updated_at = NOW()
        WHERE id = NEW.calculation_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on new message
DROP TRIGGER IF EXISTS trigger_bump_calculation_on_message ON messages;
CREATE TRIGGER trigger_bump_calculation_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION bump_calculation_updated_at();
