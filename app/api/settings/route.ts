import { NextRequest, NextResponse } from 'next/server';
import { getStoreSettings } from '@/lib/db';

// Get settings for a shop
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shop = searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
  }

  try {
    const { settings, error } = await getStoreSettings(shop);

    if (error) {
      console.error('Error fetching settings:', error);
      // Return default settings on error
      return NextResponse.json({
        enabled: true,
        protectionProductId: null,
        price: 490,
        toggleColor: '#2196F3',
        toggleText: 'Shipping Protection',
        description: 'Protect your order from damage, loss, or theft during shipping.',
        design: {
          backgroundColor: '#FFFFFF',
          cartAccentColor: '#f6f6f7',
          cartTextColor: '#000000',
          savingsTextColor: '#2ea818',
          cornerRadius: 21,
          buttonText: 'Proceed to Checkout',
          buttonColor: '#1c8cd9',
          buttonTextColor: '#FFFFFF',
          buttonTextHoverColor: '#e9e9e9',
          showSavings: true,
          showContinueShopping: true,
          showTotalOnButton: true,
          cartTitle: 'Cart',
          cartTitleAlignment: 'left',
          emptyCartText: 'Your cart is empty',
          savingsText: 'Save',
        }
      });
    }

    // Transform database format to API format
    return NextResponse.json({
      enabled: settings?.enabled ?? true,
      protectionProductId: settings?.protection_product_id || null,
      price: settings?.price ?? 490,
      toggleColor: settings?.toggle_color ?? '#2196F3',
      toggleText: settings?.toggle_text ?? 'Shipping Protection',
      description: settings?.description ?? 'Protect your order from damage, loss, or theft during shipping.',
      // Design settings
      design: {
        backgroundColor: '#FFFFFF',
        cartAccentColor: '#f6f6f7',
        cartTextColor: '#000000',
        savingsTextColor: '#2ea818',
        cornerRadius: 21,
        buttonText: 'Proceed to Checkout',
        buttonColor: '#1c8cd9',
        buttonTextColor: '#FFFFFF',
        buttonTextHoverColor: '#e9e9e9',
        showSavings: true,
        showContinueShopping: true,
        showTotalOnButton: true,
        cartTitle: 'Cart',
        cartTitleAlignment: 'left',
        emptyCartText: 'Your cart is empty',
        savingsText: 'Save',
      }
    });
  } catch (error) {
    console.error('Settings API error:', error);
    // Return default settings on error
    return NextResponse.json({
      enabled: true,
      protectionProductId: null,
      price: 490,
      toggleColor: '#2196F3',
      toggleText: 'Shipping Protection',
      description: 'Protect your order from damage, loss, or theft during shipping.',
      design: {
        backgroundColor: '#FFFFFF',
        cartAccentColor: '#f6f6f7',
        cartTextColor: '#000000',
        savingsTextColor: '#2ea818',
        cornerRadius: 21,
        buttonText: 'Proceed to Checkout',
        buttonColor: '#1c8cd9',
        buttonTextColor: '#FFFFFF',
        buttonTextHoverColor: '#e9e9e9',
        showSavings: true,
        showContinueShopping: true,
        showTotalOnButton: true,
        cartTitle: 'Cart',
        cartTitleAlignment: 'left',
        emptyCartText: 'Your cart is empty',
        savingsText: 'Save',
      }
    });
  }
}

// Update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, protectionProductId, price, toggleColor, toggleText, description } = body;

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    const { updateStoreSettings } = await import('@/lib/db');

    // Update in database
    const { settings, error } = await updateStoreSettings(shop, {
      protection_product_id: protectionProductId,
      price,
      toggle_color: toggleColor,
      toggle_text: toggleText,
      description,
      enabled: true,
    } as any);

    if (error) {
      console.error('Error updating settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      settings: {
        enabled: settings?.enabled,
        protectionProductId: settings?.protection_product_id,
        price: settings?.price,
        toggleColor: settings?.toggle_color,
        toggleText: settings?.toggle_text,
        description: settings?.description,
      }
    });
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

