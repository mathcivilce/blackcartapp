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

    // Call the Supabase edge function directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log(`🔄 [Admin Batch Sync API] Calling edge function for all stores`);
    
    const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify(syncParams) // No store_id = sync all stores
    });

    if (!syncResponse.ok) {
      const errorText = await syncResponse.text();
      console.error('❌ [Admin Batch Sync API] Edge function error:', errorText);
      return NextResponse.json({
        success: false,
        error: 'Batch sync failed',
        details: errorText
      }, { status: 500 });
    }

    const syncResults = await syncResponse.json();
    console.log('✅ [Admin Batch Sync API] Edge function response:', syncResults);

    // Extract results from edge function response
    const { results } = syncResults;
    
    if (!results) {
      return NextResponse.json({
        success: false,
        error: 'Invalid response from sync function'
      }, { status: 500 });
    }

    // Calculate summary for frontend
    const summary = {
      totalStores: results.totalStores || 0,
      successfulSyncs: results.successfulStores || 0,
      failedSyncs: results.failedStores || 0,
      totalRevenue: results.totalRevenue || 0,
      totalCommission: results.totalCommission || 0,
      totalSales: results.totalProtectionSales || 0,
      totalNewSales: results.storeResults?.reduce((sum: number, r: any) => sum + (r.new_sales_count || 0), 0) || 0
    };

    console.log(`✅ [Admin Batch Sync API] Batch sync complete:`, summary);

    return NextResponse.json({
      success: true,
      summary,
      results: results.storeResults || []
    });

  } catch (error) {
    console.error('❌ [Admin Batch Sync API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync'
    }, { status: 500 });
  }
}

