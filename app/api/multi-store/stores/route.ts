import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// POST /api/multi-store/stores - Add a new backup store
export async function POST(request: NextRequest) {
  try {
    const { shop_domain, api_token } = await request.json();

    if (!shop_domain || !api_token) {
      return NextResponse.json({
        success: false,
        error: 'Shop domain and API token are required'
      }, { status: 400 });
    }

    // Clean domain
    const cleanDomain = shop_domain
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .trim();

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

    // Get user's store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      return NextResponse.json({
        success: false,
        error: 'No store found'
      }, { status: 404 });
    }

    // Check if user already has 5 backup stores
    const { count } = await supabase
      .from('backup_stores')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store.id);

    if (count && count >= 5) {
      return NextResponse.json({
        success: false,
        error: 'Maximum 5 backup stores allowed'
      }, { status: 400 });
    }

    // Validate Shopify API token
    const shopifyUrl = `https://${cleanDomain}/admin/api/2024-01/shop.json`;
    
    const shopResponse = await fetch(shopifyUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': api_token,
        'Content-Type': 'application/json'
      }
    });

    if (!shopResponse.ok) {
      return NextResponse.json({ 
        success: false,
        error: shopResponse.status === 401 
          ? 'Invalid API token or insufficient permissions'
          : `Shopify API error: ${shopResponse.statusText}`
      }, { status: 400 });
    }

    const shopData = await shopResponse.json();
    const canonicalDomain = shopData.shop.myshopify_domain;

    // Check if this backup store already exists
    const { data: existing } = await supabase
      .from('backup_stores')
      .select('id')
      .eq('store_id', store.id)
      .eq('shop_domain', canonicalDomain)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'This backup store is already added'
      }, { status: 400 });
    }

    // Add backup store
    const { data: backupStore, error: insertError } = await supabase
      .from('backup_stores')
      .insert({
        store_id: store.id,
        shop_domain: canonicalDomain,
        api_token: api_token,
        enabled: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting backup store:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Failed to add backup store'
      }, { status: 500 });
    }

    // Automatically trigger product sync for the new store
    try {
      await fetch(`${request.nextUrl.origin}/api/multi-store/sync-products`, {
        method: 'POST',
        headers: {
          'Cookie': request.headers.get('cookie') || ''
        }
      });
    } catch (syncError) {
      console.log('Auto-sync failed, user can sync manually:', syncError);
    }

    return NextResponse.json({
      success: true,
      backupStore
    });

  } catch (error) {
    console.error('Error adding backup store:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add backup store'
    }, { status: 500 });
  }
}

