-- Add border toggle for free gifts section
ALTER TABLE settings
ADD COLUMN free_gifts_show_border BOOLEAN DEFAULT TRUE;

