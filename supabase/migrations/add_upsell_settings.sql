-- Add upsell settings to settings table
ALTER TABLE settings
ADD COLUMN upsell_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN upsell_item1_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN upsell_item1_product_handle TEXT,
ADD COLUMN upsell_item1_variant_id TEXT,
ADD COLUMN upsell_item2_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN upsell_item2_product_handle TEXT,
ADD COLUMN upsell_item2_variant_id TEXT,
ADD COLUMN upsell_item3_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN upsell_item3_product_handle TEXT,
ADD COLUMN upsell_item3_variant_id TEXT;

