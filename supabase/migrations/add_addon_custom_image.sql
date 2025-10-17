-- Add custom image settings for add-on product to settings table
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS addon_use_custom_image BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS addon_custom_image_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS addon_custom_image_size INTEGER DEFAULT 48;

