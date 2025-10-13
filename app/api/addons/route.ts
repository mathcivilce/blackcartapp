import { NextRequest, NextResponse } from 'next/server';
import { getStoreSettings, updateStoreSettings } from '@/lib/db';

// GET add-ons settings
export async function GET(request: NextRequest) {
  try {
    const shop = request.nextUrl.searchParams.get('shop') || 'example-store.myshopify.com';
    const { settings, error } = await getStoreSettings(shop);

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
    const { shop, featureEnabled, shippingProtection } = body;

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter is required' }, { status: 400 });
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
    }

    const { error } = await updateStoreSettings(shop, dbSettings);

    if (error) {
      console.error('Error updating add-ons settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add-ons settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

