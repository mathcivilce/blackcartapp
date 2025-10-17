-- Add countdown formatting options to announcement settings
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS announcement_countdown_bold BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS announcement_countdown_italic BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS announcement_countdown_underline BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS announcement_countdown_time_format TEXT DEFAULT 'text';

-- Add comments for documentation
COMMENT ON COLUMN settings.announcement_countdown_bold IS 'Apply bold formatting to countdown text';
COMMENT ON COLUMN settings.announcement_countdown_italic IS 'Apply italic formatting to countdown text';
COMMENT ON COLUMN settings.announcement_countdown_underline IS 'Apply underline formatting to countdown text';
COMMENT ON COLUMN settings.announcement_countdown_time_format IS 'Time format for countdown: text (13m 9s) or numeric (13:09)';

