-- Add position and unlocked message settings for free gifts
ALTER TABLE settings
ADD COLUMN free_gifts_position TEXT DEFAULT 'bottom', -- 'top' or 'bottom'
ADD COLUMN free_gifts_tier1_unlocked_message TEXT DEFAULT '🎉 Free Gift Unlocked!',
ADD COLUMN free_gifts_tier1_show_unlocked_message BOOLEAN DEFAULT TRUE,
ADD COLUMN free_gifts_tier2_unlocked_message TEXT DEFAULT '🎉 Free Gift Unlocked!',
ADD COLUMN free_gifts_tier2_show_unlocked_message BOOLEAN DEFAULT TRUE,
ADD COLUMN free_gifts_tier3_unlocked_message TEXT DEFAULT '🎉 Free Gift Unlocked!',
ADD COLUMN free_gifts_tier3_show_unlocked_message BOOLEAN DEFAULT TRUE;

