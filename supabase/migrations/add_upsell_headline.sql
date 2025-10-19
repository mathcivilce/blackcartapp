-- Add upsell headline customization
ALTER TABLE settings
ADD COLUMN upsell_headline_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN upsell_headline_text TEXT DEFAULT 'Help Save More Animals';

