import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Batch sync all users' orders - Admin only
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [Admin Batch Sync API] Request received');
    
    const body = await request.json();
    const { days_back, start_date, end_date } = body;
    
    // Use either days_back or date range
    const syncParams: any = {};
    if (start_date && end_date) {
      syncParams.start_date = start_date;
      syncParams.end_date = end_date;
    } else {
      syncParams.days_back = days_back || 7;
    }
    
    // Authenticate user
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      console.log('❌ [Admin Batch Sync API] No access token found');
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
      console.log('❌ [Admin Batch Sync API] Invalid session:', userError);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid session. Please login again.'
      }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = user.user_metadata?.admin === true;
    
    if (!isAdmin) {
      console.log('❌ [Admin Batch Sync API] User is not admin:', user.email);
      return NextResponse.json({ 
        success: false,
        error: 'Access denied. Admin privileges required.'
      }, { status: 403 });
    }

    console.log('✅ [Admin Batch Sync API] Admin authenticated:', user.email);

    // Use service role client to fetch all stores with Shopify credentials
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: stores, error: storesError } = await serviceClient
      .from('stores')
      .select('id, shop_domain, api_token, user_id')
      .not('api_token', 'is', null);

    if (storesError) {
      console.error('❌ [Admin Batch Sync API] Error fetching stores:', storesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch stores',
        details: storesError.message || storesError
      }, { status: 500 });
    }

    console.log(`✅ [Admin Batch Sync API] Found ${stores?.length || 0} stores with API tokens`);

    if (!stores || stores.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stores to sync',
        results: []
      });
    }

    console.log(`🔄 [Admin Batch Sync API] Starting batch sync for ${stores.length} stores`);

    // Sync all stores in a loop with delay to avoid rate limiting
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const store of stores) {
      try {
        console.log(`🔄 Syncing store: ${store.shop_domain}`);
        
        // Call the existing sync API for each store
        const syncResponse = await fetch(`${request.nextUrl.origin}/api/admin/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `sb-access-token=${accessToken}`
          },
          body: JSON.stringify({
            userId: store.user_id,
            ...syncParams
          })
        });

        const syncData = await syncResponse.json();
        
        if (syncData.success) {
          successCount++;
          results.push({
            storeId: store.id,
            shopDomain: store.shop_domain,
            success: true,
            ...syncData.results?.storeResults?.[0]
          });
        } else {
          errorCount++;
          results.push({
            storeId: store.id,
            shopDomain: store.shop_domain,
            success: false,
            error: syncData.error || 'Sync failed'
          });
        }

        // Add a small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Error syncing store ${store.shop_domain}:`, error);
        errorCount++;
        results.push({
          storeId: store.id,
          shopDomain: store.shop_domain,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Calculate aggregate results
    const totalRevenue = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.revenue || 0), 0);
    
    const totalCommission = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.commission || 0), 0);
    
    const totalSales = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.protection_sales || 0), 0);

    const totalNewSales = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.new_sales_count || 0), 0);

    console.log(`✅ [Admin Batch Sync API] Batch sync complete:`, {
      totalStores: stores.length,
      successful: successCount,
      failed: errorCount,
      totalRevenue,
      totalCommission,
      totalSales,
      totalNewSales
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalStores: stores.length,
        successfulSyncs: successCount,
        failedSyncs: errorCount,
        totalRevenue,
        totalCommission,
        totalSales,
        totalNewSales
      },
      results
    });

  } catch (error) {
    console.error('❌ [Admin Batch Sync API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync'
    }, { status: 500 });
  }
}

