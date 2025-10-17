import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { shop_domain, api_token } = await request.json();

    // Check if store exists
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id, access_token')
      .eq('user_id', user.id)
      .single();

    let storeId = existingStore?.id;
    let accessTokenValue = existingStore?.access_token;

    if (!existingStore) {
      // Create new store
      const { data: newStore, error: createError } = await supabase
        .from('stores')
        .insert({
          user_id: user.id,
          shop_domain: shop_domain || '',
          api_token: api_token || '',
          subscription_status: 'active'
        })
        .select('id, access_token')
        .single();

      if (createError) {
        console.error('Failed to create store:', createError);
        return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
      }

      storeId = newStore.id;
      accessTokenValue = newStore.access_token;

      // Create default settings for NEW stores only
      await supabase
        .from('settings')
        .insert({
          store_id: storeId,
          cart_active: true,  // Default to active for new stores
          enabled: true
        });
      
      console.log('✅ Created default settings for new store');
    } else {
      // Update existing store
      const updateData: any = {};
      if (shop_domain !== undefined) updateData.shop_domain = shop_domain;
      if (api_token !== undefined) updateData.api_token = api_token;

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('stores')
          .update(updateData)
          .eq('id', storeId);
        
        console.log('✅ Updated store info, settings preserved');
      }
    }

    // Get current settings to return to frontend
    const { data: currentSettings } = await supabase
      .from('settings')
      .select('cart_active, enabled')
      .eq('store_id', storeId)
      .single();

    return NextResponse.json({
      success: true,
      store: {
        id: storeId,
        access_token: accessTokenValue
      },
      // Return current settings so frontend can update its state
      settings: {
        cart_active: currentSettings?.cart_active ?? true,
        enabled: currentSettings?.enabled ?? true
      }
    });
  } catch (error) {
    console.error('Update store error:', error);
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
  }
}

