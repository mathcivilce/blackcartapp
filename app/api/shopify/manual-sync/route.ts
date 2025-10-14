import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

/**
 * Manual order sync trigger for authenticated users
 * Allows users to sync their own store's orders on-demand
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user (using the proven pattern from /api/auth/me)
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authenticated. Please login first.'
      }, { status: 401 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid session. Please login again.'
      }, { status: 401 });
    }

    const { days_back = 7 } = await request.json();

    // Get user's store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
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
        error: 'Please configure your Shopify API token first'
      }, { status: 400 });
    }

    console.log(`🔄 Manual sync requested by user ${user.id} for store ${store.shop_domain}`);

    // Call the sync-orders endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const syncResponse = await fetch(`${baseUrl}/api/shopify/sync-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        store_id: store.id,
        days_back
      })
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

    return NextResponse.json({
      success: true,
      message: `Successfully synced orders from last ${days_back} days`,
      results: syncResults.results
    });

  } catch (error) {
    console.error('❌ Manual sync error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed'
    }, { status: 500 });
  }
}

