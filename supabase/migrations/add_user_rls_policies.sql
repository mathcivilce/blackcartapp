-- Migration: Add RLS Policies for User Access
-- Date: 2025-01-14
-- Description: Allow authenticated users to access their own stores and settings

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read their own store" ON stores;
DROP POLICY IF EXISTS "Users can update their own store" ON stores;
DROP POLICY IF EXISTS "Users can read settings for their store" ON settings;
DROP POLICY IF EXISTS "Users can update settings for their store" ON settings;

-- Stores table policies
CREATE POLICY "Users can read their own store" ON stores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own store" ON stores
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own store" ON stores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Settings table policies
CREATE POLICY "Users can read settings for their store" ON settings
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update settings for their store" ON settings
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert settings for their store" ON settings
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

