import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Generate invoice for a specific user - Admin only
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [Admin Invoice Generation] Request received');
    
    // Parse request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'userId is required'
      }, { status: 400 });
    }

    // Authenticate user
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      console.log('❌ [Admin Invoice Generation] No access token found');
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
      console.log('❌ [Admin Invoice Generation] Invalid session:', userError);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid session. Please login again.'
      }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = user.user_metadata?.admin === true;
    
    if (!isAdmin) {
      console.log('❌ [Admin Invoice Generation] User is not admin:', user.email);
      return NextResponse.json({ 
        success: false,
        error: 'Access denied. Admin privileges required.'
      }, { status: 403 });
    }

    console.log('✅ [Admin Invoice Generation] Admin authenticated:', user.email);

    // Use service role client
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get target user's store
    const { data: store, error: storeError } = await serviceClient
      .from('stores')
      .select('id, shop_domain, stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (storeError || !store) {
      console.log('⚠️ [Admin Invoice Generation] No store found for user:', userId);
      return NextResponse.json({
        success: false,
        error: 'No store found for this user'
      }, { status: 404 });
    }

    if (!store.stripe_customer_id) {
      console.log('⚠️ [Admin Invoice Generation] No Stripe customer ID for store:', store.shop_domain);
      return NextResponse.json({
        success: false,
        error: 'This user does not have a Stripe customer ID configured. Cannot generate invoice.'
      }, { status: 400 });
    }

    // Call the edge function with the store_id to generate invoice for this specific store
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-weekly-invoices`;
    
    console.log('🔄 Calling edge function for store:', store.shop_domain);
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        store_id: store.id, // Pass specific store ID to edge function
        test_mode: false
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Edge function error:', data);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to generate invoice', 
          details: data 
        },
        { status: response.status }
      );
    }

    console.log('✅ [Admin Invoice Generation] Invoice generated:', data);

    return NextResponse.json({
      success: true,
      message: 'Invoice generated successfully',
      results: data
    });

  } catch (error) {
    console.error('❌ [Admin Invoice Generation] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate invoice'
    }, { status: 500 });
  }
}

