// Supabase Edge Function for Daily Order Synchronization --
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
  daysBack?: number,
  startDate?: string,
  endDate?: string
): Promise<{ orders: ShopifyOrder[]; error?: string }> {
  try {
    let createdAtMin: string;
    let createdAtMax: string;

    if (startDate && endDate) {
      // Use custom date range
      createdAtMin = new Date(startDate).toISOString();
      createdAtMax = new Date(endDate).toISOString();
    } else {
      // Use days_back
      const now = new Date();
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - (daysBack || 2));
      createdAtMin = pastDate.toISOString();
      createdAtMax = now.toISOString();
    }

    const params = new URLSearchParams({
      status: 'any',
      limit: '250',
      created_at_min: createdAtMin,
      created_at_max: createdAtMax,
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

// Helper: Calculate commission based on platform fee percentage
function calculateCommission(protectionPrice: number, platformFeePercent: number): number {
  return Math.round(protectionPrice * (platformFeePercent / 100));
}

// Helper: Get month identifier
function getMonthIdentifier(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Helper: Get week identifier
function getWeekIdentifier(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const daysSinceStartOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.ceil((daysSinceStartOfYear + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
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
    const { store_id, days_back, start_date, end_date } = await req.json().catch(() => ({}));

    if (start_date && end_date) {
      console.log(`📅 Syncing orders from ${start_date} to ${end_date}`);
    } else {
      console.log(`📅 Syncing orders from last ${days_back || 2} days`);
    }

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
        // Get platform fee for this store (default to 25 if not set)
        const platformFee = store.platform_fee ?? 25;
        console.log(`💰 Platform fee for ${store.shop_domain}: ${platformFee}%`);

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
          days_back,
          start_date,
          end_date
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

        let storeProtectionCount = 0; // New sales saved
        let storeProtectionTotal = 0; // Total protection sales found
        let storeRevenue = 0; // Revenue from new sales
        let storeTotalRevenue = 0; // Total revenue from all found
        let storeCommission = 0; // Commission from new sales
        let storeTotalCommission = 0; // Total commission from all found
        let skippedCount = 0; // Already existing sales

        // Process each order
        for (const order of orders) {
          // Find protection product first
          const protectionItem = order.line_items.find(item =>
            isProtectionProduct(item, protectionProductId)
          );

          if (!protectionItem) {
            continue; // No protection in this order
          }

          const protectionPrice = priceStringToCents(protectionItem.price);
          const commission = calculateCommission(protectionPrice, platformFee);
          
          // Count all protection sales found (for accurate reporting)
          storeProtectionTotal++;
          storeTotalRevenue += protectionPrice;
          storeTotalCommission += commission;

          // Check for duplicate
          const { data: existingSale } = await supabase
            .from('sales')
            .select('id')
            .eq('order_id', order.id.toString())
            .eq('store_id', store.id)
            .maybeSingle();

          if (existingSale) {
            console.log(`⏭️ Order ${order.name} already recorded`);
            skippedCount++;
            continue;
          }

          console.log(`✅ NEW protection sale in ${order.name}`);
          
          const orderDate = new Date(order.created_at);
          const monthId = getMonthIdentifier(orderDate);
          const weekId = getWeekIdentifier(orderDate);

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
              week: weekId,
              created_at: order.created_at
            });

          if (insertError) {
            console.error(`❌ Failed to insert ${order.name}:`, insertError);
          } else {
            storeProtectionCount++; // Count only new sales
            storeRevenue += protectionPrice;
            storeCommission += commission;
          }
        }

        results.successfulStores++;
        results.totalProtectionSales += storeProtectionTotal; // Use total found
        results.totalRevenue += storeTotalRevenue;
        results.totalCommission += storeTotalCommission;

        results.storeResults.push({
          store_domain: store.shop_domain,
          success: true,
          orders_checked: orders.length,
          protection_sales: storeProtectionTotal, // Total found
          new_sales_count: storeProtectionCount, // New sales saved
          existing_sales_count: skippedCount, // Already saved
          revenue: storeTotalRevenue, // Total revenue from all found
          commission: storeTotalCommission // Total commission from all found
        });

        console.log(`✅ ${store.shop_domain}: ${storeProtectionTotal} found (${storeProtectionCount} new, ${skippedCount} already saved)`);

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

