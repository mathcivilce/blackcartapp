-- Add shop_currency column to stores table
-- This stores the shop's base currency (e.g., 'USD', 'JPY', 'EUR')
-- Used for converting protection product prices to USD before billing

ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS shop_currency TEXT DEFAULT 'USD';

-- Add index for faster queries filtering by currency
CREATE INDEX IF NOT EXISTS idx_stores_shop_currency ON stores(shop_currency);

-- Add comment for documentation
COMMENT ON COLUMN stores.shop_currency IS 'Shop base currency code (ISO 4217) - e.g., USD, JPY, EUR. All sales are converted to USD before billing.';

