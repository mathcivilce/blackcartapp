-- Add button customization for upsell products
ALTER TABLE settings
ADD COLUMN upsell_button_color TEXT DEFAULT '#1a3a52',
ADD COLUMN upsell_button_corner_radius INTEGER DEFAULT 6;

