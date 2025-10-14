// Supabase Edge Function for Daily Order Synchronization
// Deno runtime

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShopifyOrder {
  id: number;
  name: string;
  created_at: string;
  line_items: Array<{
    id: number;
    product_id: number | null;
    variant_id: number | null;
    title: string;
    price: string;
    quantity: number;
    sku: string | null;
    name: string;
  }>;
}

// Helper: Fetch orders from Shopify
async function fetchShopifyOrders(
  shopDomain: string,
  apiToken: string,
  daysBack: number = 2
): Promise<{ orders: ShopifyOrder[]; error?: string }> {
  try {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysBack);

    const params = new URLSearchParams({
      status: 'any',
      limit: '250',
      created_at_min: startDate.toISOString(),
      created_at_max: now.toISOString(),
    });

    const url = `https://${shopDomain}/admin/api/2024-01/orders.json?${params}`;

    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': apiToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { orders: [], error: `Shopify API error: ${response.status}` };
    }

    const data = await response.json();
    return { orders: data.orders || [] };
  } catch (error) {
    return { orders: [], error: error.message };
  }
}

// Helper: Check if line item is protection product
function isProtectionProduct(
  lineItem: ShopifyOrder['line_items'][0],
  protectionProductId: string | null
): boolean {
  if (!protectionProductId) return false;

  const normalizedId = protectionProductId.toLowerCase().trim();
  
  if (lineItem.sku && lineItem.sku.toLowerCase().includes(normalizedId)) {
    return true;
  }
  
  if (lineItem.title && lineItem.title.toLowerCase().includes(normalizedId)) {
    return true;
  }
  
  if (lineItem.name && lineItem.name.toLowerCase().includes(normalizedId)) {
    return true;
  }

  const protectionKeywords = ['shipping protection', 'shipping insurance', 'package protection'];
  const itemTitle = lineItem.title?.toLowerCase() || '';
  
  return protectionKeywords.some(keyword => itemTitle.includes(keyword));
}

// Helper: Convert price string to cents
function priceStringToCents(priceString: string): number {
  const price = parseFloat(priceString);
  if (isNaN(price)) return 0;
  return Math.round(price * 100);
}

// Helper: Calculate commission (25%)
function calculateCommission(protectionPrice: number): number {
  return Math.round(protectionPrice * 0.25);
}

// Helper: Get month identifier
function getMonthIdentifier(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Starting order sync edge function...');

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Parse request body (optional parameters)
    const { store_id, days_back = 2 } = await req.json().catch(() => ({}));

    console.log(`📅 Syncing orders from last ${days_back} days`);

    // Get stores to sync
    let storeQuery = supabase
      .from('stores')
      .select('*')
      .not('api_token', 'is', null)
      .eq('subscription_status', 'active');

    if (store_id) {
      storeQuery = storeQuery.eq('id', store_id);
    }

    const { data: stores, error: storeError } = await storeQuery;

    if (storeError || !stores || stores.length === 0) {
      console.log('⚠️ No active stores found with API tokens');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active stores to sync',
          results: {
            totalStores: 0,
            successfulStores: 0,
            failedStores: 0,
            totalOrders: 0,
            totalProtectionSales: 0,
            totalRevenue: 0,
            totalCommission: 0,
            storeResults: []
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Processing ${stores.length} store(s)`);

    const results = {
      totalStores: stores.length,
      successfulStores: 0,
      failedStores: 0,
      totalOrders: 0,
      totalProtectionSales: 0,
      totalRevenue: 0,
      totalCommission: 0,
      storeResults: [] as any[]
    };

    // Process each store
    for (const store of stores) {
      console.log(`\n🏪 Processing: ${store.shop_domain}`);
      
      try {
        // Get store settings
        const { data: settings } = await supabase
          .from('settings')
          .select('addon_product_id, protection_product_id')
          .eq('store_id', store.id)
          .single();

        const protectionProductId = settings?.addon_product_id || 
                                    settings?.protection_product_id || 
                                    'shipping-protection';

        // Fetch orders from Shopify
        const { orders, error } = await fetchShopifyOrders(
          store.shop_domain,
          store.api_token,
          days_back
        );

        if (error) {
          console.error(`❌ Error for ${store.shop_domain}:`, error);
          results.failedStores++;
          results.storeResults.push({
            store_domain: store.shop_domain,
            success: false,
            error
          });
          continue;
        }

        console.log(`📦 Found ${orders.length} orders`);
        results.totalOrders += orders.length;

        let storeProtectionCount = 0;
        let storeRevenue = 0;
        let storeCommission = 0;

        // Process each order
        for (const order of orders) {
          // Check for duplicate
          const { data: existingSale } = await supabase
            .from('sales')
            .select('id')
            .eq('order_id', order.id.toString())
            .eq('store_id', store.id)
            .maybeSingle();

          if (existingSale) {
            console.log(`⏭️ Order ${order.name} already recorded`);
            continue;
          }

          // Find protection product
          const protectionItem = order.line_items.find(item =>
            isProtectionProduct(item, protectionProductId)
          );

          if (protectionItem) {
            console.log(`✅ Protection found in ${order.name}`);
            
            const protectionPrice = priceStringToCents(protectionItem.price);
            const commission = calculateCommission(protectionPrice);
            const monthId = getMonthIdentifier(new Date(order.created_at));

            // Insert sale record
            const { error: insertError } = await supabase
              .from('sales')
              .insert({
                store_id: store.id,
                order_id: order.id.toString(),
                order_number: order.name,
                protection_price: protectionPrice,
                commission: commission,
                month: monthId,
                created_at: order.created_at
              });

            if (insertError) {
              console.error(`❌ Failed to insert ${order.name}:`, insertError);
            } else {
              storeProtectionCount++;
              storeRevenue += protectionPrice;
              storeCommission += commission;
            }
          }
        }

        results.successfulStores++;
        results.totalProtectionSales += storeProtectionCount;
        results.totalRevenue += storeRevenue;
        results.totalCommission += storeCommission;

        results.storeResults.push({
          store_domain: store.shop_domain,
          success: true,
          orders_checked: orders.length,
          protection_sales: storeProtectionCount,
          revenue: storeRevenue,
          commission: storeCommission
        });

        console.log(`✅ ${store.shop_domain}: ${storeProtectionCount} sales`);

      } catch (storeError) {
        console.error(`❌ Error processing ${store.shop_domain}:`, storeError);
        results.failedStores++;
        results.storeResults.push({
          store_domain: store.shop_domain,
          success: false,
          error: storeError.message
        });
      }
    }

    console.log('\n📊 Sync Complete:');
    console.log(`   Stores: ${results.successfulStores}/${results.totalStores}`);
    console.log(`   Orders checked: ${results.totalOrders}`);
    console.log(`   Protection sales: ${results.totalProtectionSales}`);
    console.log(`   Revenue: $${(results.totalRevenue / 100).toFixed(2)}`);
    console.log(`   Commission: $${(results.totalCommission / 100).toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order sync completed',
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Edge function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
})

