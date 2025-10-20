-- Add platform_fee column to stores table
-- Default is 25 (representing 25%)
ALTER TABLE stores 
ADD COLUMN platform_fee INTEGER DEFAULT 25 CHECK (platform_fee >= 0 AND platform_fee <= 100);

-- Add comment for documentation
COMMENT ON COLUMN stores.platform_fee IS 'Platform fee percentage (0-100). Default is 25%.';

