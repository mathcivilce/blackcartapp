import { NextRequest, NextResponse } from 'next/server';
import { getStoreSettings } from '@/lib/db';
import { supabase } from '@/lib/supabase';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

// Get settings for a shop (using access token for authentication)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const shop = searchParams.get('shop'); // For backward compatibility during transition

  // Token-based authentication (preferred method)
  if (token) {
    try {
      const { data: store, error } = await supabase
        .from('stores')
        .select('*, settings(*)')
        .eq('access_token', token)
        .single();

      if (error || !store) {
        const response = NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        // Add CORS headers
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
        return response;
      }

      const settings = store.settings?.[0]; // Get first settings record
      
      const response = NextResponse.json({
        enabled: settings?.enabled ?? true,
        cart_active: settings?.cart_active ?? true,
        store_domain: store?.shop_domain || '',
        api_token: store?.api_token || '',
        protectionProductId: settings?.protection_product_id || settings?.addon_product_id || null,
        price: settings?.price ?? 490,
        toggleColor: settings?.toggle_color ?? '#2196F3',
        toggleText: settings?.toggle_text ?? 'Shipping Protection',
        description: settings?.description ?? 'Protect your order from damage, loss, or theft during shipping.',
        design: {
          backgroundColor: settings?.background_color || '#FFFFFF',
          cartAccentColor: settings?.cart_accent_color || '#f6f6f7',
          cartTextColor: settings?.cart_text_color || '#000000',
          savingsTextColor: settings?.savings_text_color || '#2ea818',
          cornerRadius: settings?.corner_radius || 21,
          buttonText: settings?.button_text || 'Proceed to Checkout',
          buttonColor: settings?.button_color || '#1c8cd9',
          buttonTextColor: settings?.button_text_color || '#FFFFFF',
          buttonTextHoverColor: settings?.button_text_hover_color || '#e9e9e9',
          showSavings: settings?.show_savings ?? true,
          showContinueShopping: settings?.show_continue_shopping ?? true,
          showTotalOnButton: settings?.show_total_on_button ?? true,
          cartTitle: settings?.cart_title || 'Cart',
          cartTitleAlignment: settings?.cart_title_alignment || 'left',
          emptyCartText: settings?.empty_cart_text || 'Your cart is empty',
          savingsText: settings?.savings_text || 'Save',
          displayCompareAtPrice: settings?.display_compare_at_price ?? true,
          closeButtonSize: settings?.close_button_size || 'medium',
          closeButtonColor: settings?.close_button_color || '#637381',
          closeButtonBorder: settings?.close_button_border || 'none',
          closeButtonBorderColor: settings?.close_button_border_color || '#000000',
        },
        addons: {
          enabled: settings?.addons_enabled ?? true,
          title: settings?.addon_title || 'Shipping Protection',
          description: settings?.addon_description || 'Protect your order from damage, loss, or theft during shipping.',
          price: settings?.addon_price || 4.90,
          productId: settings?.addon_product_id || null,
          acceptByDefault: settings?.addon_accept_by_default ?? false,
        }
      });
      
      // Add CORS headers to response
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    } catch (error) {
      console.error('Token validation error:', error);
      const response = NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      return response;
    }
  }

  // Fallback to shop-based (for backward compatibility - will be deprecated)
  if (!shop) {
    return NextResponse.json({ error: 'Token or shop parameter required' }, { status: 400 });
  }

  try {
    const { settings, store, error } = await getStoreSettings(shop);

    if (error) {
      console.error('Error fetching settings:', error);
      // Return default settings on error
      return NextResponse.json({
        enabled: true,
        cart_active: true,
        store_domain: '',
        api_token: '',
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
          displayCompareAtPrice: true,
          closeButtonSize: 'medium',
          closeButtonColor: '#637381',
          closeButtonBorder: 'none',
          closeButtonBorderColor: '#000000',
        },
        addons: {
          enabled: true,
          title: 'Shipping Protection',
          description: 'Protect your order from damage, loss, or theft during shipping.',
          price: 4.90,
          productId: null,
          acceptByDefault: false,
        }
      });
    }

    // Transform database format to API format
    return NextResponse.json({
      enabled: settings?.enabled ?? true,
      cart_active: settings?.cart_active ?? true,
      store_domain: store?.shop_domain || '',
      api_token: store?.api_token || '',
      protectionProductId: settings?.protection_product_id || settings?.addon_product_id || null,
      price: settings?.price ?? 490,
      toggleColor: settings?.toggle_color ?? '#2196F3',
      toggleText: settings?.toggle_text ?? 'Shipping Protection',
      description: settings?.description ?? 'Protect your order from damage, loss, or theft during shipping.',
      // Design settings
      design: {
        backgroundColor: settings?.background_color || '#FFFFFF',
        cartAccentColor: settings?.cart_accent_color || '#f6f6f7',
        cartTextColor: settings?.cart_text_color || '#000000',
        savingsTextColor: settings?.savings_text_color || '#2ea818',
        cornerRadius: settings?.corner_radius || 21,
        buttonText: settings?.button_text || 'Proceed to Checkout',
        buttonColor: settings?.button_color || '#1c8cd9',
        buttonTextColor: settings?.button_text_color || '#FFFFFF',
        buttonTextHoverColor: settings?.button_text_hover_color || '#e9e9e9',
        showSavings: settings?.show_savings ?? true,
        showContinueShopping: settings?.show_continue_shopping ?? true,
        showTotalOnButton: settings?.show_total_on_button ?? true,
        cartTitle: settings?.cart_title || 'Cart',
        cartTitleAlignment: settings?.cart_title_alignment || 'left',
        emptyCartText: settings?.empty_cart_text || 'Your cart is empty',
        savingsText: settings?.savings_text || 'Save',
        displayCompareAtPrice: settings?.display_compare_at_price ?? true,
        closeButtonSize: settings?.close_button_size || 'medium',
        closeButtonColor: settings?.close_button_color || '#637381',
        closeButtonBorder: settings?.close_button_border || 'none',
        closeButtonBorderColor: settings?.close_button_border_color || '#000000',
      },
      // Add-ons settings
      addons: {
        enabled: settings?.addons_enabled ?? true,
        title: settings?.addon_title || 'Shipping Protection',
        description: settings?.addon_description || 'Protect your order from damage, loss, or theft during shipping.',
        price: settings?.addon_price || 4.90,
        productId: settings?.addon_product_id || null,
        acceptByDefault: settings?.addon_accept_by_default ?? false,
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
        displayCompareAtPrice: true,
        closeButtonSize: 'medium',
        closeButtonColor: '#637381',
        closeButtonBorder: 'none',
        closeButtonBorderColor: '#000000',
      },
      addons: {
        enabled: true,
        title: 'Shipping Protection',
        description: 'Protect your order from damage, loss, or theft during shipping.',
        price: 4.90,
        productId: null,
        acceptByDefault: false,
      }
    });
  }
}

// Update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, protectionProductId, price, toggleColor, toggleText, description, cart_active, store_domain, api_token } = body;

    // If cart_active is being updated (from dashboard)
    if (cart_active !== undefined) {
      const { updateStoreSettings } = await import('@/lib/db');
      
      // For now, use a default shop or get from session
      // You may need to update this based on your auth implementation
      const shopDomain = shop || 'default-shop';
      
      const { settings, error } = await updateStoreSettings(shopDomain, {
        cart_active: cart_active,
      } as any);

      if (error) {
        console.error('Error updating cart_active:', error);
        return NextResponse.json({ error: 'Failed to update cart activation' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true,
        cart_active: settings?.cart_active
      });
    }

    // If store_domain or api_token is being updated (from dashboard)
    if (store_domain !== undefined || api_token !== undefined) {
      const { updateStoreInfo } = await import('@/lib/db');
      
      // For now, use a default shop or get from session
      const shopDomain = shop || 'default-shop';
      
      const updateData: any = {};
      if (store_domain !== undefined) updateData.shop_domain = store_domain; // Note: using shop_domain for stores table
      if (api_token !== undefined) updateData.api_token = api_token;
      
      const { store: updatedStore, error } = await updateStoreInfo(shopDomain, updateData);

      if (error) {
        console.error('Error updating store info:', error);
        return NextResponse.json({ error: 'Failed to update store information' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true,
        store: {
          shop_domain: updatedStore?.shop_domain,
          api_token: updatedStore?.api_token
        }
      });
    }

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

