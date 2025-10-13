-- Migration: Add Design and Add-ons Settings
-- Date: 2025-01-14

-- Add design customization columns to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#FFFFFF';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS cart_accent_color TEXT DEFAULT '#f6f6f7';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS cart_text_color TEXT DEFAULT '#000000';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS savings_text_color TEXT DEFAULT '#2ea818';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS corner_radius INTEGER DEFAULT 21;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS button_text TEXT DEFAULT 'Proceed to Checkout';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS button_color TEXT DEFAULT '#1c8cd9';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS button_text_color TEXT DEFAULT '#FFFFFF';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS button_text_hover_color TEXT DEFAULT '#e9e9e9';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_savings BOOLEAN DEFAULT true;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_continue_shopping BOOLEAN DEFAULT true;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_total_on_button BOOLEAN DEFAULT true;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS cart_title TEXT DEFAULT 'Cart';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS cart_title_alignment TEXT DEFAULT 'left';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS empty_cart_text TEXT DEFAULT 'Your cart is empty';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS savings_text TEXT DEFAULT 'Save';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS display_compare_at_price BOOLEAN DEFAULT true;

-- Close button customization
ALTER TABLE settings ADD COLUMN IF NOT EXISTS close_button_size TEXT DEFAULT 'medium';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS close_button_color TEXT DEFAULT '#637381';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS close_button_border TEXT DEFAULT 'none';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS close_button_border_color TEXT DEFAULT '#000000';

-- Add-ons settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS addons_enabled BOOLEAN DEFAULT true;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS addon_title TEXT DEFAULT 'Shipping Protection';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS addon_description TEXT DEFAULT 'Protect your order from damage, loss, or theft during shipping.';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS addon_price DECIMAL(10,2) DEFAULT 4.90;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS addon_product_id TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS addon_accept_by_default BOOLEAN DEFAULT false;

