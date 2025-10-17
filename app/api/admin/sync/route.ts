import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Admin manual sync - sync orders for a specific user
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
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
      return NextResponse.json({ 
        success: false,
        error: 'Invalid session. Please login again.'
      }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = user.user_metadata?.admin === true;
    
    if (!isAdmin) {
      console.log('❌ [Admin Sync API] User is not admin:', user.email);
      return NextResponse.json({ 
        success: false,
        error: 'Access denied. Admin privileges required.'
      }, { status: 403 });
    }

    const { userId, days_back, start_date, end_date } = await request.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId is required'
      }, { status: 400 });
    }

    // Prepare sync parameters - use either days_back or date range
    const syncParams: any = { store_id: '' }; // Will be set below
    if (start_date && end_date) {
      syncParams.start_date = start_date;
      syncParams.end_date = end_date;
      console.log(`🔄 Admin sync requested by ${user.email} for user ${userId} (date range: ${start_date} to ${end_date})`);
    } else {
      syncParams.days_back = days_back || 7;
      console.log(`🔄 Admin sync requested by ${user.email} for user ${userId} (last ${syncParams.days_back} days)`);
    }

    // Use service role to get target user's store
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: store, error: storeError } = await serviceClient
      .from('stores')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (storeError || !store) {
      return NextResponse.json({
        success: false,
        error: 'No store found for this user'
      }, { status: 404 });
    }

    // Check if API token is configured
    if (!store.api_token) {
      return NextResponse.json({
        success: false,
        error: 'This user has not configured their Shopify API token'
      }, { status: 400 });
    }

    console.log(`🔄 Syncing orders for store ${store.shop_domain}`);

    // Call the Supabase edge function directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Set the store_id in syncParams
    syncParams.store_id = store.id;
    
    const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify(syncParams)
    });

    if (!syncResponse.ok) {
      const errorData = await syncResponse.json();
      return NextResponse.json({
        success: false,
        error: 'Sync failed',
        details: errorData
      }, { status: 500 });
    }

    const syncResults = await syncResponse.json();

    const message = start_date && end_date 
      ? `Successfully synced orders from ${start_date} to ${end_date} for ${store.shop_domain}`
      : `Successfully synced orders from last ${syncParams.days_back} days for ${store.shop_domain}`;

    return NextResponse.json({
      success: true,
      message,
      results: syncResults.results
    });

  } catch (error) {
    console.error('❌ Admin sync error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed'
    }, { status: 500 });
  }
}

