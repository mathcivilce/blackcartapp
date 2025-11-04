import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

/**
 * Get sales data for the authenticated user's store
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Sales API] Request received');
    
    // Authenticate user
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      console.log('❌ [Sales API] No access token found');
      return NextResponse.json({ 
        success: false,
        error: 'Not authenticated. Please login first.'
      }, { status: 401 });
    }

    // Create client with user's access token
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
      console.log('❌ [Sales API] Invalid session:', userError);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid session. Please login again.'
      }, { status: 401 });
    }

    console.log('✅ [Sales API] User authenticated:', user.id);

    // Get user's store using authenticated client (bypasses potential service role issues)
    const { data: store, error: storeError } = await authClient
      .from('stores')
      .select('id, shop_domain, shop_name')
      .eq('user_id', user.id)
      .single();

    console.log('🏪 [Sales API] Store query:', { store, storeError });

    if (storeError || !store) {
      console.log('⚠️ [Sales API] No store found for user');
      return NextResponse.json({
        success: true,
        sales: [],
        summary: {
          totalSales: 0,
          totalRevenue: 0,
          totalCommission: 0
        },
        message: 'No store configured yet'
      });
    }

    // Query 1: Get accurate aggregates (no limit) for summary cards
    const { count, error: countError } = await authClient
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store.id);

    if (countError) {
      console.error('❌ [Sales API] Error fetching count:', countError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch sales count'
      }, { status: 500 });
    }

    // Get sum aggregates for revenue and commission - fetch in batches to bypass 1000 row limit
    let allAggregates: any[] = [];
    let hasMore = true;
    let offset = 0;
    const batchSize = 1000;

    while (hasMore) {
      const { data: aggregatesBatch, error: aggregatesError } = await authClient
        .from('sales')
        .select('protection_price, commission')
        .eq('store_id', store.id)
        .range(offset, offset + batchSize - 1);

      if (aggregatesError) {
        console.error('❌ [Sales API] Error fetching aggregates batch:', aggregatesError);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch sales aggregates'
        }, { status: 500 });
      }

      if (aggregatesBatch && aggregatesBatch.length > 0) {
        allAggregates = allAggregates.concat(aggregatesBatch);
        offset += batchSize;
        hasMore = aggregatesBatch.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    const totalRevenue = allAggregates.reduce((sum, sale) => sum + (sale.protection_price || 0), 0);
    const totalCommission = allAggregates.reduce((sum, sale) => sum + (sale.commission || 0), 0);

    // Query 2: Get recent sales for display (with limit)
    const { data: sales, error: salesError } = await authClient
      .from('sales')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(100);

    console.log('💰 [Sales API] Sales query:', { totalCount: count, displayedCount: sales?.length, salesError });

    if (salesError) {
      console.error('❌ [Sales API] Error fetching sales:', salesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch sales data'
      }, { status: 500 });
    }

    // Summary with accurate counts from aggregates
    const summary = {
      totalSales: count || 0,
      totalRevenue,
      totalCommission,
      displayedSales: sales?.length || 0  // Number of sales actually being displayed
    };

    console.log('✅ [Sales API] Returning data:', { salesCount: sales?.length, summary });

    return NextResponse.json({
      success: true,
      sales: sales || [],
      summary,
      store: {
        domain: store.shop_domain,
        name: store.shop_name
      }
    });

  } catch (error) {
    console.error('❌ [Sales API] Error fetching user sales:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sales'
    }, { status: 500 });
  }
}

