import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/multi-store/checkout-redirect - Get checkout redirect URL
// This is called by cart.js before checkout
export async function POST(request: NextRequest) {
  try {
    const { shop_domain, cart_items } = await request.json();

    if (!shop_domain || !cart_items || !Array.isArray(cart_items)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request'
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get store by domain
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('shop_domain', shop_domain)
      .single();

    if (storeError || !store) {
      return NextResponse.json({
        success: false,
        error: 'Store not found',
        redirect: false
      });
    }

    // Check if multi-store is enabled
    const { data: settings } = await supabase
      .from('settings')
      .select('multi_store_enabled')
      .eq('store_id', store.id)
      .single();

    if (!settings?.multi_store_enabled) {
      return NextResponse.json({
        success: true,
        redirect: false,
        message: 'Multi-store not enabled'
      });
    }

    // Get enabled backup stores
    const { data: backupStores, error: backupError } = await supabase
      .from('backup_stores')
      .select('id, shop_domain')
      .eq('store_id', store.id)
      .eq('enabled', true);

    if (backupError || !backupStores || backupStores.length === 0) {
      return NextResponse.json({
        success: true,
        redirect: false,
        message: 'No backup stores available'
      });
    }

    // Randomly select a backup store
    const selectedStore = backupStores[Math.floor(Math.random() * backupStores.length)];

    // Get product mappings for selected backup store
    const variantIds = cart_items.map((item: any) => item.variant_id);
    
    const { data: mappings, error: mappingsError } = await supabase
      .from('product_mappings')
      .select('primary_variant_id, backup_variant_id')
      .eq('store_id', store.id)
      .eq('backup_store_id', selectedStore.id)
      .in('primary_variant_id', variantIds);

    if (mappingsError || !mappings || mappings.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No product mappings found. Please sync products first.',
        redirect: false
      });
    }

    // Build mapping dictionary
    const variantMap = new Map();
    mappings.forEach((m: any) => {
      variantMap.set(m.primary_variant_id, m.backup_variant_id);
    });

    // Build cart permalink for backup store
    // Format: /cart/VARIANT_ID:QUANTITY,VARIANT_ID:QUANTITY
    const cartItems = cart_items
      .map((item: any) => {
        const backupVariantId = variantMap.get(item.variant_id.toString());
        if (!backupVariantId) {
          console.log(`No mapping for variant ${item.variant_id}`);
          return null;
        }
        return `${backupVariantId}:${item.quantity}`;
      })
      .filter((item: any) => item !== null);

    if (cartItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Could not map cart items to backup store',
        redirect: false
      });
    }

    const cartPermalink = cartItems.join(',');
    const checkoutUrl = `https://${selectedStore.shop_domain}/cart/${cartPermalink}`;

    console.log(`Redirecting checkout to: ${selectedStore.shop_domain}`);
    console.log(`Cart permalink: ${cartPermalink}`);

    return NextResponse.json({
      success: true,
      redirect: true,
      checkout_url: checkoutUrl,
      backup_store: selectedStore.shop_domain,
      items_mapped: cartItems.length
    });

  } catch (error) {
    console.error('Error getting checkout redirect:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get checkout redirect',
      redirect: false
    }, { status: 500 });
  }
}

