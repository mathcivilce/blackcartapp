-- Multi-Store Checkout Feature
-- Allows users to redirect checkout traffic to backup stores

-- Table: Backup Stores
-- Each store can have up to 5 backup stores
CREATE TABLE IF NOT EXISTS backup_stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  shop_domain TEXT NOT NULL, -- e.g., "backup-store.myshopify.com"
  api_token TEXT NOT NULL, -- API token for the backup store
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: Product Mappings (SKU-based)
-- Maps products from primary store to backup stores
CREATE TABLE IF NOT EXISTS product_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  backup_store_id UUID REFERENCES backup_stores(id) ON DELETE CASCADE,
  sku TEXT NOT NULL, -- Product SKU (matches across stores)
  primary_variant_id TEXT NOT NULL, -- Variant ID in primary store
  backup_variant_id TEXT NOT NULL, -- Variant ID in backup store
  primary_product_title TEXT, -- For reference
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, backup_store_id, sku)
);

-- Add multi-store checkout settings to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS multi_store_enabled BOOLEAN DEFAULT false;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_backup_stores_store_id ON backup_stores(store_id);
CREATE INDEX IF NOT EXISTS idx_backup_stores_enabled ON backup_stores(store_id, enabled);
CREATE INDEX IF NOT EXISTS idx_product_mappings_store_id ON product_mappings(store_id);
CREATE INDEX IF NOT EXISTS idx_product_mappings_sku ON product_mappings(sku);
CREATE INDEX IF NOT EXISTS idx_product_mappings_backup_store ON product_mappings(backup_store_id);

-- Comments for documentation
COMMENT ON TABLE backup_stores IS 'Backup stores for multi-store checkout redirect';
COMMENT ON TABLE product_mappings IS 'SKU-based mapping of products between primary and backup stores';
COMMENT ON COLUMN settings.multi_store_enabled IS 'Enable multi-store checkout redirect feature';

-- RLS Policies
ALTER TABLE backup_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_mappings ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to backup_stores" ON backup_stores
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to product_mappings" ON product_mappings
  FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can read their own backup stores
CREATE POLICY "Users can read their own backup stores" ON backup_stores
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Authenticated users can read their own product mappings
CREATE POLICY "Users can read their own product mappings" ON product_mappings
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_backup_stores_updated_at BEFORE UPDATE ON backup_stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

