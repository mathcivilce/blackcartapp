import { supabase, Settings, Store } from './supabase';

// Get or create store by shop domain
export async function getOrCreateStore(shopDomain: string) {
  // Check if store exists
  const { data: existingStore, error: fetchError } = await supabase
    .from('stores')
    .select('*')
    .eq('shop_domain', shopDomain)
    .single();

  if (existingStore) {
    return { store: existingStore as Store, error: null };
  }

  // Create new store if doesn't exist
  const { data: newStore, error: createError } = await supabase
    .from('stores')
    .insert({
      shop_domain: shopDomain,
      subscription_status: 'active' // Default to active for testing
    })
    .select()
    .single();

  if (createError) {
    return { store: null, error: createError };
  }

  // Create default settings for new store
  await supabase
    .from('settings')
    .insert({
      store_id: newStore.id,
      price: 490,
      toggle_color: '#2196F3',
      toggle_text: 'Shipping Protection',
      description: 'Protect your order from damage, loss, or theft during shipping.',
      enabled: true
    });

  return { store: newStore as Store, error: null };
}

// Get settings for a store
export async function getStoreSettings(shopDomain: string) {
  // Get or create store first
  const { store, error: storeError } = await getOrCreateStore(shopDomain);
  
  if (storeError || !store) {
    return { settings: null, error: storeError };
  }

  // Get settings
  const { data: settings, error: settingsError } = await supabase
    .from('settings')
    .select('*')
    .eq('store_id', store.id)
    .single();

  if (settingsError) {
    return { settings: null, error: settingsError };
  }

  return { settings: settings as Settings, error: null };
}

// Update settings for a store
export async function updateStoreSettings(
  shopDomain: string,
  updates: Partial<Settings>
) {
  const { store, error: storeError } = await getOrCreateStore(shopDomain);
  
  if (storeError || !store) {
    return { settings: null, error: storeError };
  }

  const { data: settings, error: updateError } = await supabase
    .from('settings')
    .update(updates)
    .eq('store_id', store.id)
    .select()
    .single();

  if (updateError) {
    return { settings: null, error: updateError };
  }

  return { settings: settings as Settings, error: null };
}

// Save a sale
export async function saveSale(
  shopDomain: string,
  orderData: {
    order_id: string;
    order_number?: string;
    protection_price: number;
  }
) {
  const { store, error: storeError } = await getOrCreateStore(shopDomain);
  
  if (storeError || !store) {
    return { sale: null, error: storeError };
  }

  const commission = Math.round(orderData.protection_price * 0.2); // 20%
  const month = new Date().toISOString().slice(0, 7); // "2025-01"

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .upsert({
      store_id: store.id,
      order_id: orderData.order_id,
      order_number: orderData.order_number,
      protection_price: orderData.protection_price,
      commission,
      month
    }, {
      onConflict: 'store_id,order_id'
    })
    .select()
    .single();

  return { sale, error: saleError };
}

