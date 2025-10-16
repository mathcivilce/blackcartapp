-- Migration: Add RLS Policies for Sales and Invoices User Access
-- Date: 2025-10-16
-- Description: Allow authenticated users to read their own sales and invoices

-- Drop existing user policies if any
DROP POLICY IF EXISTS "Users can read sales for their store" ON sales;
DROP POLICY IF EXISTS "Users can read invoices for their store" ON invoices;

-- Sales table policies for users
CREATE POLICY "Users can read sales for their store" ON sales
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Invoices table policies for users
CREATE POLICY "Users can read invoices for their store" ON invoices
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

