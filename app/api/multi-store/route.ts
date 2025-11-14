import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// GET /api/multi-store - Get current multi-store configuration
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

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
    const { data: store, error: storeError } = await authClient
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

    // Get settings with multi_store_enabled
    const { data: settings, error: settingsError } = await authClient
      .from('settings')
      .select('multi_store_enabled')
      .eq('store_id', store.id)
      .single();

    // Get backup stores
    const { data: backupStores, error: backupError } = await authClient
      .from('backup_stores')
      .select('id, shop_domain, enabled, created_at')
      .eq('store_id', store.id)
      .order('created_at', { ascending: true });

    // Get last sync time from product_mappings
    const { data: lastMapping } = await authClient
      .from('product_mappings')
      .select('last_synced_at')
      .eq('store_id', store.id)
      .order('last_synced_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      enabled: settings?.multi_store_enabled || false,
      backupStores: backupStores || [],
      lastSyncTime: lastMapping?.last_synced_at || null
    });

  } catch (error) {
    console.error('Error fetching multi-store config:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch configuration'
    }, { status: 500 });
  }
}

