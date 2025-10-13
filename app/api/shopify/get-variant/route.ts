import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { productId, token } = await request.json();

    if (!productId || !token) {
      return NextResponse.json({ error: 'Product ID and token required' }, { status: 400 });
    }

    // Get store by access token
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('shop_domain, api_token')
      .eq('access_token', token)
      .single();

    if (storeError || !store || !store.api_token) {
      return NextResponse.json({ error: 'Invalid token or API not configured' }, { status: 401 });
    }

    // Fetch product from Shopify to get variant ID
    const shopifyUrl = `https://${store.shop_domain}/admin/api/2024-01/products/${productId}.json`;
    
    console.log('🔍 Fetching product from Shopify:', productId);
    
    const shopifyResponse = await fetch(shopifyUrl, {
      headers: {
        'X-Shopify-Access-Token': store.api_token,
        'Content-Type': 'application/json',
      },
    });

    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text();
      console.error('Shopify API error:', shopifyResponse.status, errorText);
      return NextResponse.json({ 
        error: 'Failed to fetch product from Shopify',
        details: errorText 
      }, { status: shopifyResponse.status });
    }

    const productData = await shopifyResponse.json();
    
    // Get the first variant (default variant)
    const firstVariant = productData.product?.variants?.[0];
    
    if (!firstVariant) {
      return NextResponse.json({ error: 'No variants found for this product' }, { status: 404 });
    }

    console.log('✅ Found variant:', firstVariant.id);

    return NextResponse.json({
      variantId: firstVariant.id,
      title: productData.product.title,
      variantTitle: firstVariant.title,
      price: firstVariant.price,
    });
  } catch (error) {
    console.error('Get variant error:', error);
    return NextResponse.json({ error: 'Failed to get variant' }, { status: 500 });
  }
}

