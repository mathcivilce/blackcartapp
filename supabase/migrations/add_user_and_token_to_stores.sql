-- Migration: Add User ID and Access Token to Stores
-- Date: 2025-01-14
-- Description: Link stores to users and add unique access tokens for API authentication

-- Add user_id column (foreign key to auth.users)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add access_token column (unique per store)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS access_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_stores_access_token ON stores(access_token);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);

