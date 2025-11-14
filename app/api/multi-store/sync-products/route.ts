import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// POST /api/multi-store/sync-products - Sync products using SKU matching
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    const { data: { user }, error: userError } = await authClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid session'
      }, { status: 401 });
    }

    // Get user's primary store with API token
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, shop_domain, api_token')
      .eq('user_id', user.id)
      .single();

    if (storeError || !store || !store.api_token) {
      return NextResponse.json({
        success: false,
        error: 'No store found or missing API token'
      }, { status: 404 });
    }

    // Get all enabled backup stores
    const { data: backupStores, error: backupError } = await supabase
      .from('backup_stores')
      .select('id, shop_domain, api_token')
      .eq('store_id', store.id)
      .eq('enabled', true);

    if (backupError || !backupStores || backupStores.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No enabled backup stores found'
      }, { status: 400 });
    }

    // Fetch products from primary store
    console.log('Fetching products from primary store:', store.shop_domain);
    const primaryProducts = await fetchAllProducts(store.shop_domain, store.api_token);

    if (!primaryProducts || primaryProducts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No products found in primary store'
      }, { status: 400 });
    }

    // Build SKU map for primary store
    const primarySKUMap = new Map();
    primaryProducts.forEach((product: any) => {
      product.variants.forEach((variant: any) => {
        if (variant.sku) {
          primarySKUMap.set(variant.sku, {
            variant_id: variant.id.toString(),
            product_title: product.title
          });
        }
      });
    });

    console.log(`Found ${primarySKUMap.size} SKUs in primary store`);

    let totalMappings = 0;

    // Process each backup store
    for (const backupStore of backupStores) {
      console.log('Processing backup store:', backupStore.shop_domain);
      
      // Fetch products from backup store
      const backupProducts = await fetchAllProducts(backupStore.shop_domain, backupStore.api_token);

      if (!backupProducts || backupProducts.length === 0) {
        console.log('No products in backup store, skipping');
        continue;
      }

      // Match SKUs and create mappings
      const mappings = [];

      backupProducts.forEach((product: any) => {
        product.variants.forEach((variant: any) => {
          if (variant.sku && primarySKUMap.has(variant.sku)) {
            const primaryData = primarySKUMap.get(variant.sku);
            mappings.push({
              store_id: store.id,
              backup_store_id: backupStore.id,
              sku: variant.sku,
              primary_variant_id: primaryData.variant_id,
              backup_variant_id: variant.id.toString(),
              primary_product_title: primaryData.product_title,
              last_synced_at: new Date().toISOString()
            });
          }
        });
      });

      console.log(`Found ${mappings.length} matching SKUs for ${backupStore.shop_domain}`);

      if (mappings.length > 0) {
        // Upsert mappings (replace existing)
        const { error: upsertError } = await supabase
          .from('product_mappings')
          .upsert(mappings, {
            onConflict: 'store_id,backup_store_id,sku'
          });

        if (upsertError) {
          console.error('Error upserting mappings:', upsertError);
        } else {
          totalMappings += mappings.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      mappingsCreated: totalMappings,
      primaryStoreProducts: primarySKUMap.size,
      backupStoresProcessed: backupStores.length
    });

  } catch (error) {
    console.error('Error syncing products:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to sync products'
    }, { status: 500 });
  }
}

// Helper: Fetch all products from a Shopify store
async function fetchAllProducts(shopDomain: string, apiToken: string): Promise<any[]> {
  try {
    const url = `https://${shopDomain}/admin/api/2024-01/products.json?limit=250`;
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': apiToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch products from ${shopDomain}:`, response.status);
      return [];
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error(`Error fetching products from ${shopDomain}:`, error);
    return [];
  }
}

