import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Debug endpoint to check store and settings
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  try {
    // Get store by token
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('access_token', token)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found', details: storeError }, { status: 404 });
    }

    // Get settings for this store
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('store_id', store.id)
      .single();

    if (settingsError) {
      return NextResponse.json({ 
        store: {
          id: store.id,
          shop_domain: store.shop_domain,
          access_token: '***' + store.access_token.slice(-4),
        },
        settings: null,
        error: 'No settings found',
        details: settingsError
      });
    }

    return NextResponse.json({
      store: {
        id: store.id,
        shop_domain: store.shop_domain,
        access_token: '***' + store.access_token.slice(-4),
        user_id: store.user_id,
      },
      settings: {
        id: settings.id,
        store_id: settings.store_id,
        button_text: settings.button_text,
        cart_title: settings.cart_title,
        background_color: settings.background_color,
        button_color: settings.button_color,
        addons_enabled: settings.addons_enabled,
        addon_title: settings.addon_title,
        // Show all fields to debug
        ...settings
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error', details: error }, { status: 500 });
  }
}

