import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (error) {
      console.error('Error fetching upsell settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return NextResponse.json({
      enabled: settings.upsell_enabled || false,
      buttonColor: settings.upsell_button_color || '#1a3a52',
      buttonCornerRadius: settings.upsell_button_corner_radius || 6,
      item1: {
        enabled: settings.upsell_item1_enabled || false,
        productHandle: settings.upsell_item1_product_handle || '',
        variantId: settings.upsell_item1_variant_id || '',
      },
      item2: {
        enabled: settings.upsell_item2_enabled || false,
        productHandle: settings.upsell_item2_product_handle || '',
        variantId: settings.upsell_item2_variant_id || '',
      },
      item3: {
        enabled: settings.upsell_item3_enabled || false,
        productHandle: settings.upsell_item3_product_handle || '',
        variantId: settings.upsell_item3_variant_id || '',
      },
    });
  } catch (error) {
    console.error('Error fetching upsell settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, ...upsellSettings } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    // Update upsell settings
    const { data, error } = await supabase
      .from('settings')
      .update({
        upsell_enabled: upsellSettings.enabled,
        upsell_button_color: upsellSettings.buttonColor,
        upsell_button_corner_radius: upsellSettings.buttonCornerRadius,
        upsell_item1_enabled: upsellSettings.item1.enabled,
        upsell_item1_product_handle: upsellSettings.item1.productHandle,
        upsell_item1_variant_id: upsellSettings.item1.variantId,
        upsell_item2_enabled: upsellSettings.item2.enabled,
        upsell_item2_product_handle: upsellSettings.item2.productHandle,
        upsell_item2_variant_id: upsellSettings.item2.variantId,
        upsell_item3_enabled: upsellSettings.item3.enabled,
        upsell_item3_product_handle: upsellSettings.item3.productHandle,
        upsell_item3_variant_id: upsellSettings.item3.variantId,
        updated_at: new Date().toISOString(),
      })
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating upsell settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    // ⚡ CACHE INVALIDATION: Increment cache_version to invalidate edge function cache
    const { error: cacheError } = await supabase.rpc('increment_cache_version', {
      store_id_param: storeId
    });

    if (cacheError) {
      console.warn('Warning: Failed to invalidate cache, but settings were saved:', cacheError);
    } else {
      console.log('✅ Cache invalidated for store:', storeId);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating upsell settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

