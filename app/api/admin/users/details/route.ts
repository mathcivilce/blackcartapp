import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Get user details including platform fee - Admin only
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Admin User Details] Request received');
    
    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json({ 
        success: false,
        error: 'userId parameter is required'
      }, { status: 400 });
    }

    // Authenticate user
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      console.log('❌ [Admin User Details] No access token found');
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
      console.log('❌ [Admin User Details] Invalid session:', userError);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid session. Please login again.'
      }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = user.user_metadata?.admin === true;
    
    if (!isAdmin) {
      console.log('❌ [Admin User Details] User is not admin:', user.email);
      return NextResponse.json({ 
        success: false,
        error: 'Access denied. Admin privileges required.'
      }, { status: 403 });
    }

    console.log('✅ [Admin User Details] Admin authenticated:', user.email);

    // Use service role client to fetch user details
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get target user's store with platform fee
    const { data: store, error: storeError } = await serviceClient
      .from('stores')
      .select('id, shop_domain, shop_name, email, subscription_status, platform_fee, created_at')
      .eq('user_id', targetUserId)
      .single();

    if (storeError || !store) {
      console.log('⚠️ [Admin User Details] No store found for user:', targetUserId);
      return NextResponse.json({
        success: false,
        error: 'No store configured for this user'
      }, { status: 404 });
    }

    console.log('✅ [Admin User Details] Returning data:', { 
      userId: targetUserId,
      shop: store.shop_domain,
      platformFee: store.platform_fee 
    });

    return NextResponse.json({
      success: true,
      userDetails: {
        userId: targetUserId,
        email: store.email,
        shopDomain: store.shop_domain,
        shopName: store.shop_name,
        subscriptionStatus: store.subscription_status,
        platformFee: store.platform_fee || 25, // Default to 25 if null
        createdAt: store.created_at
      }
    });

  } catch (error) {
    console.error('❌ [Admin User Details] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user details'
    }, { status: 500 });
  }
}

