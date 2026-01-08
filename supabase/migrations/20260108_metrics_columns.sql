-- Add metrics columns for aggregation without JSON parsing
ALTER TABLE calculations 
ADD COLUMN IF NOT EXISTS total_cost_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_items_count integer DEFAULT 0;

-- Create index for analytics and sorting
CREATE INDEX IF NOT EXISTS idx_calculations_total_cost ON calculations (total_cost_value);
CREATE INDEX IF NOT EXISTS idx_calculations_total_items ON calculations (total_items_count);

-- Optional: Backfill existing data (this would be a separate migration script normally)
-- UPDATE calculations 
-- SET 
--   total_cost_value = COALESCE((results->'summary'->>'totalCost')::numeric, 0),
--   total_items_count = jsonb_array_length(COALESCE(results->'summary', '[]'::jsonb));
