import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET design settings
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
      console.error('Error fetching design settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Transform database format to API format
    return NextResponse.json({
      backgroundColor: settings?.background_color || '#FFFFFF',
      cartAccentColor: settings?.cart_accent_color || '#f6f6f7',
      cartTextColor: settings?.cart_text_color || '#000000',
      savingsTextColor: settings?.savings_text_color || '#2ea818',
      cornerRadius: settings?.corner_radius?.toString() || '21',
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
    });
  } catch (error) {
    console.error('Design settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST (update) design settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, ...designSettings } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    // Transform API format to database format
    const dbSettings: any = {};
    if (designSettings.backgroundColor !== undefined) dbSettings.background_color = designSettings.backgroundColor;
    if (designSettings.cartAccentColor !== undefined) dbSettings.cart_accent_color = designSettings.cartAccentColor;
    if (designSettings.cartTextColor !== undefined) dbSettings.cart_text_color = designSettings.cartTextColor;
    if (designSettings.savingsTextColor !== undefined) dbSettings.savings_text_color = designSettings.savingsTextColor;
    if (designSettings.cornerRadius !== undefined) dbSettings.corner_radius = parseInt(designSettings.cornerRadius);
    if (designSettings.buttonText !== undefined) dbSettings.button_text = designSettings.buttonText;
    if (designSettings.buttonColor !== undefined) dbSettings.button_color = designSettings.buttonColor;
    if (designSettings.buttonTextColor !== undefined) dbSettings.button_text_color = designSettings.buttonTextColor;
    if (designSettings.buttonTextHoverColor !== undefined) dbSettings.button_text_hover_color = designSettings.buttonTextHoverColor;
    if (designSettings.showSavings !== undefined) dbSettings.show_savings = designSettings.showSavings;
    if (designSettings.showContinueShopping !== undefined) dbSettings.show_continue_shopping = designSettings.showContinueShopping;
    if (designSettings.showTotalOnButton !== undefined) dbSettings.show_total_on_button = designSettings.showTotalOnButton;
    if (designSettings.cartTitle !== undefined) dbSettings.cart_title = designSettings.cartTitle;
    if (designSettings.cartTitleAlignment !== undefined) dbSettings.cart_title_alignment = designSettings.cartTitleAlignment;
    if (designSettings.emptyCartText !== undefined) dbSettings.empty_cart_text = designSettings.emptyCartText;
    if (designSettings.savingsText !== undefined) dbSettings.savings_text = designSettings.savingsText;
    if (designSettings.displayCompareAtPrice !== undefined) dbSettings.display_compare_at_price = designSettings.displayCompareAtPrice;
    if (designSettings.closeButtonSize !== undefined) dbSettings.close_button_size = designSettings.closeButtonSize;
    if (designSettings.closeButtonColor !== undefined) dbSettings.close_button_color = designSettings.closeButtonColor;
    if (designSettings.closeButtonBorder !== undefined) dbSettings.close_button_border = designSettings.closeButtonBorder;
    if (designSettings.closeButtonBorderColor !== undefined) dbSettings.close_button_border_color = designSettings.closeButtonBorderColor;

    const { error } = await supabase
      .from('settings')
      .update(dbSettings)
      .eq('store_id', storeId);

    if (error) {
      console.error('Error updating design settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Design settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

