-- Add discount code columns for each free gift tier
ALTER TABLE settings
ADD COLUMN free_gifts_tier1_discount_code TEXT,
ADD COLUMN free_gifts_tier2_discount_code TEXT,
ADD COLUMN free_gifts_tier3_discount_code TEXT;

