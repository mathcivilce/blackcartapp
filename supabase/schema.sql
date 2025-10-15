-- Cartbase Database Schema
-- Multi-tenant setup for Shopify stores

-- 1. Stores Table
CREATE TABLE IF NOT EXISTS stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_domain TEXT UNIQUE NOT NULL,
  shop_name TEXT,
  email TEXT,
  api_token TEXT, -- Encrypted in production
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'active', -- active, past_due, canceled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  protection_product_id TEXT, -- Shopify variant ID
  price INTEGER DEFAULT 490, -- Price in cents ($4.90)
  toggle_color TEXT DEFAULT '#2196F3',
  toggle_text TEXT DEFAULT 'Shipping Protection',
  description TEXT DEFAULT 'Protect your order from damage, loss, or theft during shipping.',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id)
);

-- 3. Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL, -- Shopify order ID
  order_number TEXT, -- Human-readable order number
  protection_price INTEGER NOT NULL, -- Price in cents
  commission INTEGER NOT NULL, -- 20% commission in cents
  month TEXT NOT NULL, -- Format: "2025-01"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, order_id)
);

-- 4. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: "2025-01"
  subscription_fee INTEGER DEFAULT 2900, -- $29 in cents
  commission_total INTEGER DEFAULT 0, -- Total commission for the month
  total_amount INTEGER NOT NULL, -- subscription_fee + commission_total
  sales_count INTEGER DEFAULT 0, -- Number of protection sales
  status TEXT DEFAULT 'pending', -- pending, paid, failed
  stripe_invoice_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, month)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stores_shop_domain ON stores(shop_domain);
CREATE INDEX IF NOT EXISTS idx_settings_store_id ON settings(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_store_id ON sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_month ON sales(month);
CREATE INDEX IF NOT EXISTS idx_invoices_store_id ON invoices(store_id);
CREATE INDEX IF NOT EXISTS idx_invoices_month ON invoices(month);

-- Enable Row Level Security (RLS)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow service role full access, restrict anon key)
CREATE POLICY "Service role has full access to stores" ON stores
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to settings" ON settings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to sales" ON sales
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to invoices" ON invoices
  FOR ALL USING (auth.role() = 'service_role');

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

