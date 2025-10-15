-- Migration: Add Cart Image Settings
-- Date: 2025-01-15
-- Description: Add columns for cart header image customization

-- Add cart image customization columns to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS use_cart_image BOOLEAN DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS cart_image_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS cart_image_mobile_size INTEGER DEFAULT 100;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS cart_image_desktop_size INTEGER DEFAULT 120;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS cart_image_position TEXT DEFAULT 'left';

