import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Update platform fee for a specific user - Admin only
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [Admin Update Platform Fee] Request received');
    
    // Parse request body
    const body = await request.json();
    const { userId, platformFee } = body;

    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'userId is required'
      }, { status: 400 });
    }

    if (platformFee === undefined || platformFee === null) {
      return NextResponse.json({ 
        success: false,
        error: 'platformFee is required'
      }, { status: 400 });
    }

    // Validate platform fee range
    if (platformFee < 0 || platformFee > 100) {
      return NextResponse.json({ 
        success: false,
        error: 'Platform fee must be between 0 and 100'
      }, { status: 400 });
    }

    // Authenticate user
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      console.log('❌ [Admin Update Platform Fee] No access token found');
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
      console.log('❌ [Admin Update Platform Fee] Invalid session:', userError);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid session. Please login again.'
      }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = user.user_metadata?.admin === true;
    
    if (!isAdmin) {
      console.log('❌ [Admin Update Platform Fee] User is not admin:', user.email);
      return NextResponse.json({ 
        success: false,
        error: 'Access denied. Admin privileges required.'
      }, { status: 403 });
    }

    console.log('✅ [Admin Update Platform Fee] Admin authenticated:', user.email);

    // Use service role client to update platform fee
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update platform fee for the user's store
    const { data: store, error: updateError } = await serviceClient
      .from('stores')
      .update({ platform_fee: platformFee })
      .eq('user_id', userId)
      .select('id, shop_domain, shop_name, platform_fee')
      .single();

    if (updateError) {
      console.error('❌ [Admin Update Platform Fee] Error updating:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update platform fee'
      }, { status: 500 });
    }

    if (!store) {
      console.log('⚠️ [Admin Update Platform Fee] No store found for user:', userId);
      return NextResponse.json({
        success: false,
        error: 'No store found for this user'
      }, { status: 404 });
    }

    console.log('✅ [Admin Update Platform Fee] Platform fee updated:', { 
      userId,
      shop: store.shop_domain,
      newPlatformFee: platformFee 
    });

    return NextResponse.json({
      success: true,
      message: 'Platform fee updated successfully',
      store: {
        id: store.id,
        domain: store.shop_domain,
        name: store.shop_name,
        platformFee: store.platform_fee
      }
    });

  } catch (error) {
    console.error('❌ [Admin Update Platform Fee] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update platform fee'
    }, { status: 500 });
  }
}

