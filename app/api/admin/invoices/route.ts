import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Get invoices data for a specific user - Admin only
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Admin Invoices API] Request received');
    
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
      console.log('❌ [Admin Invoices API] No access token found');
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
      console.log('❌ [Admin Invoices API] Invalid session:', userError);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid session. Please login again.'
      }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = user.user_metadata?.admin === true;
    
    if (!isAdmin) {
      console.log('❌ [Admin Invoices API] User is not admin:', user.email);
      return NextResponse.json({ 
        success: false,
        error: 'Access denied. Admin privileges required.'
      }, { status: 403 });
    }

    console.log('✅ [Admin Invoices API] Admin authenticated:', user.email);

    // Use service role client to fetch invoices for target user
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
      console.log('⚠️ [Admin Invoices API] No store found for user:', targetUserId);
      return NextResponse.json({
        success: true,
        invoices: [],
        summary: {
          total: 0,
          paid: 0,
          pending: 0,
          failed: 0,
          totalAmount: 0,
          paidAmount: 0
        },
        message: 'No store configured for this user'
      });
    }

    // Get invoices for this store
    const { data: invoices, error: invoicesError } = await serviceClient
      .from('invoices')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false });

    if (invoicesError) {
      console.error('❌ [Admin Invoices API] Error fetching invoices:', invoicesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch invoices data'
      }, { status: 500 });
    }

    // Calculate summary
    const summary = {
      total: invoices?.length || 0,
      paid: invoices?.filter(i => i.status === 'paid').length || 0,
      pending: invoices?.filter(i => i.status === 'pending').length || 0,
      failed: invoices?.filter(i => i.status === 'failed').length || 0,
      totalAmount: invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
      paidAmount: invoices?.filter(i => i.status === 'paid')
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
    };

    console.log('✅ [Admin Invoices API] Returning data:', { 
      userId: targetUserId,
      invoicesCount: invoices?.length, 
      summary 
    });

    return NextResponse.json({
      success: true,
      invoices: invoices || [],
      summary,
      store: {
        domain: store.shop_domain,
        name: store.shop_name,
        email: store.email
      }
    });

  } catch (error) {
    console.error('❌ [Admin Invoices API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch invoices'
    }, { status: 500 });
  }
}

