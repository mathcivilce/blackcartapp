-- Change platform_fee from INTEGER to NUMERIC to support decimal values
-- This allows values like 6.5%, 12.75%, etc.

ALTER TABLE stores 
ALTER COLUMN platform_fee TYPE NUMERIC(5,2) USING platform_fee::NUMERIC(5,2);

-- Update the constraint to work with NUMERIC
ALTER TABLE stores 
DROP CONSTRAINT IF EXISTS stores_platform_fee_check;

ALTER TABLE stores 
ADD CONSTRAINT stores_platform_fee_check CHECK (platform_fee >= 0 AND platform_fee <= 100);

-- Update comment for documentation
COMMENT ON COLUMN stores.platform_fee IS 'Platform fee percentage (0.00-100.00) with up to 2 decimal places. Default is 25%. Examples: 6.5, 12.75, 25.00';

