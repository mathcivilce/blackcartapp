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

// Helper: Fetch orders from Shopify with pagination
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

    let allOrders: ShopifyOrder[] = [];
    let pageInfo: string | null = null;
    let hasNextPage = true;
    let pageCount = 0;
    const maxPages = 20; // Safety limit to prevent infinite loops

    // Paginate through all orders
    while (hasNextPage && pageCount < maxPages) {
      pageCount++;
      
      let url: string;
      
      if (pageInfo) {
        // For subsequent pages, ONLY use page_info (no other filters)
        const params = new URLSearchParams({
          limit: '250',
          page_info: pageInfo,
        });
        url = `https://${shopDomain}/admin/api/2024-01/orders.json?${params}`;
      } else {
        // For first page, use full filters
        const params = new URLSearchParams({
          status: 'any',
          limit: '250',
          created_at_min: createdAtMin,
          created_at_max: createdAtMax,
        });
        url = `https://${shopDomain}/admin/api/2024-01/orders.json?${params}`;
      }

      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': apiToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { orders: allOrders, error: `Shopify API error: ${response.status}` };
      }

      const data = await response.json();
      const orders = data.orders || [];
      allOrders = allOrders.concat(orders);

      // Check for pagination using Link header
      const linkHeader = response.headers.get('Link');
      if (linkHeader) {
        // Parse Link header to extract page_info for next page
        // Example: <https://shop.myshopify.com/admin/api/2024-01/orders.json?page_info=abc123>; rel="next"
        const nextLinkMatch = linkHeader.match(/<[^>]*page_info=([^>&]+)[^>]*>;\s*rel="next"/);
        if (nextLinkMatch) {
          pageInfo = nextLinkMatch[1];
          hasNextPage = true;
          console.log(`📄 Fetched page ${pageCount} (${orders.length} orders), continuing...`);
        } else {
          hasNextPage = false;
          console.log(`📄 Fetched page ${pageCount} (${orders.length} orders), last page reached`);
        }
      } else {
        // No Link header means no more pages
        hasNextPage = false;
        console.log(`📄 Fetched ${orders.length} orders (single page)`);
      }
    }

    if (pageCount >= maxPages) {
      console.warn(`⚠️ Reached maximum page limit (${maxPages} pages, ${allOrders.length} orders)`);
    }

    console.log(`✅ Total orders fetched: ${allOrders.length} across ${pageCount} page(s)`);
    return { orders: allOrders };
  } catch (error) {
    return { orders: [], error: error.message };
  }
}

// Helper: Get product ID from handle (reverse lookup for exact matching)
async function getProductIdByHandle(
  shopDomain: string,
  apiToken: string,
  handle: string
): Promise<{ productId: number | null; error?: string }> {
  try {
    const url = `https://${shopDomain}/admin/api/2024-01/products.json?handle=${handle}&limit=1&fields=id,handle`;
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': apiToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { productId: null, error: `Shopify API error: ${response.status}` };
    }

    const data = await response.json();
    const product = data.products?.[0];
    
    if (!product) {
      return { productId: null, error: `Product with handle "${handle}" not found` };
    }
    
    console.log(`✅ Found product ID ${product.id} for handle "${handle}"`);
    return { productId: product.id };
  } catch (error) {
    return { productId: null, error: error.message };
  }
}

// Helper: Check if line item matches protection product (fallback method)
// Uses title, SKU, and name matching for cases where product ID lookup fails
function isProtectionProductByContent(
  lineItem: ShopifyOrder['line_items'][0],
  protectionHandle: string | null
): boolean {
  if (!protectionHandle) return false;

  const normalizedHandle = protectionHandle.toLowerCase().trim();
  
  // Check SKU
  if (lineItem.sku && lineItem.sku.toLowerCase().includes(normalizedHandle)) {
    return true;
  }
  
  // Check title
  if (lineItem.title && lineItem.title.toLowerCase().includes(normalizedHandle)) {
    return true;
  }
  
  // Check name
  if (lineItem.name && lineItem.name.toLowerCase().includes(normalizedHandle)) {
    return true;
  }

  return false;
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

    console.log(`📊 Processing ${stores.length} store(s) in parallel`);

    // Process all stores in parallel using Promise.all
    const storeProcessingPromises = stores.map(async (store) => {
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

        const protectionProductHandle = settings?.addon_product_id || 
                                        settings?.protection_product_id || 
                                        'shipping-protection';

        console.log(`🔍 Looking up product ID for handle: "${protectionProductHandle}"`);
        console.log(`📋 Using dual-strategy matching: exact product ID + content-based (title/SKU/name)`);

        // Strategy 1: Get product ID from handle for exact matching
        const { productId: protectionProductId, error: productError } = await getProductIdByHandle(
          store.shop_domain,
          store.api_token,
          protectionProductHandle
        );

        if (productError || !protectionProductId) {
          console.warn(`⚠️ Could not find product ID for handle "${protectionProductHandle}": ${productError}`);
          console.log(`📝 Strategy 1 (exact ID): Unavailable - will rely on Strategy 2 (content matching)`);
        } else {
          console.log(`✅ Strategy 1 (exact ID): Product ID ${protectionProductId} found`);
        }
        
        console.log(`✅ Strategy 2 (content): Always active - matching by title/SKU/name containing "${protectionProductHandle}"`);

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
          return {
            store_domain: store.shop_domain,
            success: false,
            error
          };
        }

        console.log(`📦 Found ${orders.length} orders`);

        let storeProtectionCount = 0; // New sales saved
        let storeProtectionTotal = 0; // Total protection sales found
        let storeRevenue = 0; // Revenue from new sales
        let storeTotalRevenue = 0; // Total revenue from all found
        let storeCommission = 0; // Commission from new sales
        let storeTotalCommission = 0; // Total commission from all found
        let skippedCount = 0; // Already existing sales

        // Process each order
        for (const order of orders) {
          // Find protection product using BOTH strategies simultaneously
          // Strategy 1: Exact product ID match
          // Strategy 2: Content-based matching (title/SKU/name)
          // If EITHER strategy matches, the product is found
          const protectionItem = order.line_items.find(item => {
            // Strategy 1: Check exact product ID match
            const matchesById = protectionProductId && item.product_id === protectionProductId;
            
            // Strategy 2: Check content-based match (title/SKU/name)
            const matchesByContent = isProtectionProductByContent(item, protectionProductHandle);
            
            // Return true if EITHER strategy matches
            return matchesById || matchesByContent;
          });

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

        console.log(`✅ ${store.shop_domain}: ${storeProtectionTotal} found (${storeProtectionCount} new, ${skippedCount} already saved)`);

        return {
          store_domain: store.shop_domain,
          success: true,
          orders_checked: orders.length,
          protection_sales: storeProtectionTotal, // Total found
          new_sales_count: storeProtectionCount, // New sales saved
          existing_sales_count: skippedCount, // Already saved
          revenue: storeTotalRevenue, // Total revenue from all found
          commission: storeTotalCommission // Total commission from all found
        };

      } catch (storeError) {
        console.error(`❌ Error processing ${store.shop_domain}:`, storeError);
        return {
          store_domain: store.shop_domain,
          success: false,
          error: storeError.message
        };
      }
    });

    // Wait for all stores to complete processing in parallel
    const storeResults = await Promise.all(storeProcessingPromises);

    // Aggregate results
    const results = {
      totalStores: stores.length,
      successfulStores: 0,
      failedStores: 0,
      totalOrders: 0,
      totalProtectionSales: 0,
      totalRevenue: 0,
      totalCommission: 0,
      storeResults: storeResults
    };

    // Calculate totals from results
    for (const result of storeResults) {
      if (result.success) {
        results.successfulStores++;
        results.totalOrders += result.orders_checked || 0;
        results.totalProtectionSales += result.protection_sales || 0;
        results.totalRevenue += result.revenue || 0;
        results.totalCommission += result.commission || 0;
      } else {
        results.failedStores++;
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

