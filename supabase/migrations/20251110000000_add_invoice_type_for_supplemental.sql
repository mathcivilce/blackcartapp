-- Add invoice_type column to support supplemental invoices
-- This allows multiple invoices per week (regular + supplemental)

-- Add invoice_type column with default 'regular'
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS invoice_type TEXT DEFAULT 'regular';

-- Update existing invoices to be 'regular' type
UPDATE invoices 
SET invoice_type = 'regular' 
WHERE invoice_type IS NULL;

-- Drop the old unique constraint on (store_id, week)
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_store_id_week_key;

-- Create new unique constraint that allows multiple invoice types per week
-- But still prevents duplicate invoice types for the same store/week
ALTER TABLE invoices 
ADD CONSTRAINT invoices_store_id_week_type_key 
UNIQUE (store_id, week, invoice_type);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(invoice_type);

-- Add comment explaining the types
COMMENT ON COLUMN invoices.invoice_type IS 'Type of invoice: regular (weekly auto-generated) or supplemental (corrections for missing sales)';

