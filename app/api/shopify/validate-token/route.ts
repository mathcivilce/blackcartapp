import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Validate Shopify API token and auto-populate shop domain
export async function POST(request: NextRequest) {
  try {
    const { shop_domain, api_token } = await request.json();

    // Validate inputs
    if (!shop_domain || !api_token) {
      return NextResponse.json({ 
        success: false,
        error: 'Shop domain and API token are required'
      }, { status: 400 });
    }

    // Ensure shop_domain is clean (remove https://, trailing slashes, etc.)
    const cleanDomain = shop_domain
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .trim();

    console.log('🔍 Validating token for domain:', cleanDomain);

    // Step 1: Validate token by fetching shop information from Shopify
    const shopifyUrl = `https://${cleanDomain}/admin/api/2024-01/shop.json`;
    
    const shopResponse = await fetch(shopifyUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': api_token,
        'Content-Type': 'application/json'
      }
    });

    if (!shopResponse.ok) {
      console.error('❌ Shopify API error:', shopResponse.status, shopResponse.statusText);
      const errorText = await shopResponse.text();
      console.error('Error details:', errorText);
      
      return NextResponse.json({ 
        success: false,
        error: shopResponse.status === 401 
          ? 'Invalid API token or insufficient permissions'
          : `Shopify API error: ${shopResponse.statusText}`
      }, { status: 400 });
    }

    const shopData = await shopResponse.json();
    const shopInfo = shopData.shop;

    console.log('✅ Shop data retrieved:', {
      domain: shopInfo.domain,
      myshopify_domain: shopInfo.myshopify_domain,
      name: shopInfo.name,
      id: shopInfo.id
    });

    // Step 2: Get the CANONICAL domain from Shopify (this is the source of truth)
    // Use myshopify_domain which is the native .myshopify.com domain
    const canonicalDomain = shopInfo.myshopify_domain; // e.g., "8cd001-2.myshopify.com"
    const shopName = shopInfo.name;
    const shopifyId = shopInfo.id.toString();

    // Step 3: Verify token has read_orders permission
    const ordersTestUrl = `https://${canonicalDomain}/admin/api/2024-01/orders.json?limit=1&status=any`;
    
    const ordersResponse = await fetch(ordersTestUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': api_token,
        'Content-Type': 'application/json'
      }
    });

    if (!ordersResponse.ok) {
      console.error('❌ Orders access failed:', ordersResponse.status);
      return NextResponse.json({ 
        success: false,
        error: 'API token does not have read_orders permission. Please ensure the token has access to read orders.'
      }, { status: 400 });
    }

    console.log('✅ Token has read_orders permission');

    // Step 4: Get authenticated user
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authenticated. Please login first.'
      }, { status: 401 });
    }

    // Create client with user's access token
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
        error: 'Invalid session. Please login again.'
      }, { status: 401 });
    }

    // Step 5: Check if this store is already connected to a different user
    const { data: existingStore } = await supabase
      .from('stores')
      .select('*')
      .eq('shop_domain', canonicalDomain)
      .maybeSingle();

    if (existingStore && existingStore.user_id !== user.id) {
      return NextResponse.json({ 
        success: false,
        error: `This Shopify store is already connected to another account. If this is your store, please contact support.`
      }, { status: 409 });
    }

    // Step 6: Update or create store record with validated information
    // Use CANONICAL domain from Shopify, not user input
    // Upsert by user_id since each user can only have one store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .upsert({
        shop_domain: canonicalDomain,  // ⭐ Source of truth from Shopify
        shop_name: shopName,
        email: shopInfo.email || null,
        api_token: api_token,
        user_id: user.id,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',  // Each user has only one store
        ignoreDuplicates: false  // Always update
      })
      .select()
      .single();

    if (storeError) {
      console.error('❌ Database error:', storeError);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to save store information',
        details: storeError.message
      }, { status: 500 });
    }

    console.log('✅ Store saved/updated:', store.id);

    // Step 7: Ensure settings record exists for this store
    // IMPORTANT: Only create settings if they don't exist
    // Never modify existing settings (preserve user's cart_active and other preferences)
    const { data: existingSettings } = await supabase
      .from('settings')
      .select('*')
      .eq('store_id', store.id)
      .maybeSingle();

    if (!existingSettings) {
      const { error: settingsError } = await supabase
        .from('settings')
        .insert({
          store_id: store.id,
          cart_active: true,  // Default to true for NEW stores only
          enabled: true
        });

      if (settingsError) {
        console.error('⚠️ Failed to create settings:', settingsError);
      } else {
        console.log('✅ Settings created for NEW store');
      }
    } else {
      console.log('✅ Existing settings preserved (cart_active:', existingSettings.cart_active, ')');
    }

    // Step 8: Return success with validated store information
    // Include current settings (especially cart_active) so frontend can update its state
    return NextResponse.json({
      success: true,
      message: 'Store connected successfully',
      store: {
        id: store.id,
        shop_domain: canonicalDomain,
        shop_name: shopName,
        shopify_id: shopifyId,
        email: shopInfo.email,
        access_token: store.access_token,
        // Security note: domain might differ from user input if they had typo
        domain_corrected: canonicalDomain !== cleanDomain
      },
      // Return current settings so frontend can update its state
      settings: {
        cart_active: existingSettings?.cart_active ?? true,
        enabled: existingSettings?.enabled ?? true
      }
    });

  } catch (error) {
    console.error('❌ Token validation error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate token'
    }, { status: 500 });
  }
}

