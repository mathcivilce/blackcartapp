-- Add headline color for free gifts section
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS free_gifts_headline_color TEXT DEFAULT '#000000';

