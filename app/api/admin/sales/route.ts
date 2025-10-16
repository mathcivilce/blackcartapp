import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Get sales data for a specific user - Admin only
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Admin Sales API] Request received');
    
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
      console.log('❌ [Admin Sales API] No access token found');
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
      console.log('❌ [Admin Sales API] Invalid session:', userError);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid session. Please login again.'
      }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = user.user_metadata?.admin === true;
    
    if (!isAdmin) {
      console.log('❌ [Admin Sales API] User is not admin:', user.email);
      return NextResponse.json({ 
        success: false,
        error: 'Access denied. Admin privileges required.'
      }, { status: 403 });
    }

    console.log('✅ [Admin Sales API] Admin authenticated:', user.email);

    // Use service role client to fetch sales for target user
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get target user's store
    const { data: store, error: storeError } = await serviceClient
      .from('stores')
      .select('id, shop_domain, shop_name, email')
      .eq('user_id', targetUserId)
      .single();

    if (storeError || !store) {
      console.log('⚠️ [Admin Sales API] No store found for user:', targetUserId);
      return NextResponse.json({
        success: true,
        sales: [],
        summary: {
          totalSales: 0,
          totalRevenue: 0,
          totalCommission: 0
        },
        message: 'No store configured for this user'
      });
    }

    // Get sales for this store
    const { data: sales, error: salesError } = await serviceClient
      .from('sales')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (salesError) {
      console.error('❌ [Admin Sales API] Error fetching sales:', salesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch sales data'
      }, { status: 500 });
    }

    // Calculate summary
    const summary = {
      totalSales: sales?.length || 0,
      totalRevenue: sales?.reduce((sum, sale) => sum + (sale.protection_price || 0), 0) || 0,
      totalCommission: sales?.reduce((sum, sale) => sum + (sale.commission || 0), 0) || 0
    };

    console.log('✅ [Admin Sales API] Returning data:', { 
      userId: targetUserId,
      salesCount: sales?.length, 
      summary 
    });

    return NextResponse.json({
      success: true,
      sales: sales || [],
      summary,
      store: {
        domain: store.shop_domain,
        name: store.shop_name,
        email: store.email
      }
    });

  } catch (error) {
    console.error('❌ [Admin Sales API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sales'
    }, { status: 500 });
  }
}

