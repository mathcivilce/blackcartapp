-- Add headline bold toggle for free gifts
ALTER TABLE settings
ADD COLUMN free_gifts_headline_bold BOOLEAN DEFAULT FALSE;

