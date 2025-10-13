-- Migration: Add Cart Active Toggle
-- Date: 2025-01-14
-- Description: Add cart_active column to settings table to enable/disable the cart app

-- Add cart_active column (defaults to true to keep existing behavior)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS cart_active BOOLEAN DEFAULT true;

