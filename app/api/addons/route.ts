import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET add-ons settings
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
      console.error('Error fetching add-ons settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Transform database format to API format
    return NextResponse.json({
      featureEnabled: settings?.addons_enabled ?? true,
      shippingProtection: {
        title: settings?.addon_title || 'Shipping Protection',
        description: settings?.addon_description || 'Protect your order from damage, loss, or theft during shipping.',
        price: settings?.addon_price?.toString() || '4.90',
        productId: settings?.addon_product_id || '',
        acceptByDefault: settings?.addon_accept_by_default ?? false,
        adjustTotalPrice: settings?.addon_adjust_total_price ?? true,
        useCustomImage: settings?.addon_use_custom_image ?? false,
        customImageUrl: settings?.addon_custom_image_url || '',
        customImageSize: settings?.addon_custom_image_size || 48,
      }
    });
  } catch (error) {
    console.error('Add-ons settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST (update) add-ons settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, featureEnabled, shippingProtection } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    // Transform API format to database format
    const dbSettings: any = {};
    if (featureEnabled !== undefined) dbSettings.addons_enabled = featureEnabled;
    if (shippingProtection) {
      if (shippingProtection.title !== undefined) dbSettings.addon_title = shippingProtection.title;
      if (shippingProtection.description !== undefined) dbSettings.addon_description = shippingProtection.description;
      if (shippingProtection.price !== undefined) dbSettings.addon_price = parseFloat(shippingProtection.price);
      if (shippingProtection.productId !== undefined) dbSettings.addon_product_id = shippingProtection.productId;
      if (shippingProtection.acceptByDefault !== undefined) dbSettings.addon_accept_by_default = shippingProtection.acceptByDefault;
      if (shippingProtection.adjustTotalPrice !== undefined) dbSettings.addon_adjust_total_price = shippingProtection.adjustTotalPrice;
      if (shippingProtection.useCustomImage !== undefined) dbSettings.addon_use_custom_image = shippingProtection.useCustomImage;
      if (shippingProtection.customImageUrl !== undefined) dbSettings.addon_custom_image_url = shippingProtection.customImageUrl;
      if (shippingProtection.customImageSize !== undefined) dbSettings.addon_custom_image_size = shippingProtection.customImageSize;
    }

    const { error } = await supabase
      .from('settings')
      .update(dbSettings)
      .eq('store_id', storeId);

    if (error) {
      console.error('Error updating add-ons settings:', error);
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add-ons settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

