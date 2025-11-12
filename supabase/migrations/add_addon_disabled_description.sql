-- Add disabled description for add-on product to settings table
-- This description will be shown when the protection toggle is OFF/disabled
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS addon_disabled_description TEXT DEFAULT 'By deselecting shipping protection, we are not liable for lost, damaged, or stolen products.';

