import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  fetchShopifyOrders, 
  isProtectionProduct, 
  priceStringToCents, 
  calculateCommission,
  getDateRange,
  getMonthIdentifier 
} from '@/lib/shopify';
import { getWeekIdentifier } from '@/lib/billing';

/**
 * Sync orders from Shopify and track protection product sales
 * Can be called manually or by cron job
 */
export async function POST(request: NextRequest) {
  try {
    const { store_id, days_back = 2 } = await request.json();

    // Get date range for order fetching (default: last 2 days for overlap)
    const { startDate, endDate } = getDateRange(days_back);
    
    console.log(`🔄 Starting order sync for ${store_id ? `store ${store_id}` : 'all stores'}`);
    console.log(`📅 Date range: ${startDate} to ${endDate}`);

    // If specific store_id provided, sync only that store
    // Otherwise, sync all stores with valid API tokens
    const storeQuery = store_id 
      ? supabase.from('stores').select('*').eq('id', store_id).single()
      : supabase.from('stores').select('*').not('api_token', 'is', null);

    const { data: storeData, error: storeError } = await storeQuery;

    if (storeError || !storeData) {
      return NextResponse.json({
        success: false,
        error: 'No stores found or database error'
      }, { status: 404 });
    }

    // Handle single store vs multiple stores
    const stores = Array.isArray(storeData) ? storeData : [storeData];
    
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
      console.log(`\n🏪 Processing store: ${store.shop_domain}`);
      
      try {
        // Get store settings to find protection product identifier
        const { data: settings } = await supabase
          .from('settings')
          .select('addon_product_id, protection_product_id')
          .eq('store_id', store.id)
          .single();

        const protectionProductId = settings?.addon_product_id || settings?.protection_product_id || 'shipping-protection';

        // Fetch orders from Shopify
        const { orders, error } = await fetchShopifyOrders(
          store.shop_domain,
          store.api_token,
          {
            createdAtMin: startDate,
            createdAtMax: endDate,
            status: 'any',
            limit: 250
          }
        );

        if (error) {
          console.error(`❌ Error fetching orders for ${store.shop_domain}:`, error);
          results.failedStores++;
          results.storeResults.push({
            store_domain: store.shop_domain,
            success: false,
            error
          });
          continue;
        }

        console.log(`📦 Found ${orders.length} orders for ${store.shop_domain}`);
        results.totalOrders += orders.length;

        let storeProtectionCount = 0;
        let storeRevenue = 0;
        let storeCommission = 0;
        const newSales = [];

        // Process each order
        for (const order of orders) {
          // Check if order already exists in sales table (deduplication)
          const { data: existingSale } = await supabase
            .from('sales')
            .select('id')
            .eq('order_id', order.id.toString())
            .eq('store_id', store.id)
            .maybeSingle();

          if (existingSale) {
            console.log(`⏭️  Order ${order.name} already recorded, skipping`);
            continue;
          }

          // Find protection product in line items
          const protectionItem = order.line_items.find(item => 
            isProtectionProduct(item, protectionProductId)
          );

          if (protectionItem) {
            console.log(`✅ Found protection in order ${order.name}`);
            
            const protectionPrice = priceStringToCents(protectionItem.price);
            const commission = calculateCommission(protectionPrice);
            const orderDate = new Date(order.created_at);
            const monthId = getMonthIdentifier(orderDate);
            const weekId = getWeekIdentifier(orderDate);

            // Record the sale
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
              console.error(`❌ Failed to record sale for order ${order.name}:`, insertError);
            } else {
              storeProtectionCount++;
              storeRevenue += protectionPrice;
              storeCommission += commission;
              newSales.push({
                order_number: order.name,
                protection_price: protectionPrice,
                commission: commission
              });
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
          commission: storeCommission,
          new_sales: newSales
        });

        console.log(`✅ Store complete: ${storeProtectionCount} protection sales found`);

      } catch (storeError) {
        console.error(`❌ Error processing store ${store.shop_domain}:`, storeError);
        results.failedStores++;
        results.storeResults.push({
          store_domain: store.shop_domain,
          success: false,
          error: storeError instanceof Error ? storeError.message : 'Unknown error'
        });
      }
    }

    console.log('\n📊 Sync Summary:');
    console.log(`   Stores processed: ${results.successfulStores}/${results.totalStores}`);
    console.log(`   Total orders checked: ${results.totalOrders}`);
    console.log(`   Protection sales found: ${results.totalProtectionSales}`);
    console.log(`   Total revenue: $${(results.totalRevenue / 100).toFixed(2)}`);
    console.log(`   Total commission: $${(results.totalCommission / 100).toFixed(2)}`);

    return NextResponse.json({
      success: true,
      message: 'Order sync completed',
      results
    });

  } catch (error) {
    console.error('❌ Order sync error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync orders'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check sync status
 */
export async function GET(request: NextRequest) {
  try {
    // Get recent sales summary
    const { data: recentSales, error } = await supabase
      .from('sales')
      .select('*, stores!inner(shop_domain)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Get summary by month
    const { data: monthlySummary } = await supabase
      .rpc('get_monthly_sales_summary')
      .limit(6);

    return NextResponse.json({
      success: true,
      recent_sales: recentSales,
      monthly_summary: monthlySummary || []
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sync status'
    }, { status: 500 });
  }
}

