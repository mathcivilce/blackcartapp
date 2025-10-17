-- Add announcement text formatting fields to settings table
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS announcement_text_bold BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS announcement_text_italic BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS announcement_text_underline BOOLEAN DEFAULT FALSE;

