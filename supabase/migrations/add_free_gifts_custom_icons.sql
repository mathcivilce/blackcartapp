-- Add custom icon fields for each free gift tier
ALTER TABLE settings
ADD COLUMN free_gifts_tier1_icon TEXT DEFAULT '🎁',
ADD COLUMN free_gifts_tier2_icon TEXT DEFAULT '🎁',
ADD COLUMN free_gifts_tier3_icon TEXT DEFAULT '🎁';

