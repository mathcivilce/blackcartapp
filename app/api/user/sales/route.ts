import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

/**
 * Get sales data for the authenticated user's store
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Sales API] Request received');
    
    // Authenticate user
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      console.log('❌ [Sales API] No access token found');
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
      console.log('❌ [Sales API] Invalid session:', userError);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid session. Please login again.'
      }, { status: 401 });
    }

    console.log('✅ [Sales API] User authenticated:', user.id);

    // Get user's store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, shop_domain, shop_name')
      .eq('user_id', user.id)
      .single();

    console.log('🏪 [Sales API] Store query:', { store, storeError });

    if (storeError || !store) {
      console.log('⚠️ [Sales API] No store found for user');
      return NextResponse.json({
        success: true,
        sales: [],
        summary: {
          totalSales: 0,
          totalRevenue: 0,
          totalCommission: 0
        },
        message: 'No store configured yet'
      });
    }

    // Get sales for this store
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(100);

    console.log('💰 [Sales API] Sales query:', { salesCount: sales?.length, salesError });

    if (salesError) {
      console.error('❌ [Sales API] Error fetching sales:', salesError);
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

    console.log('✅ [Sales API] Returning data:', { salesCount: sales?.length, summary });

    return NextResponse.json({
      success: true,
      sales: sales || [],
      summary,
      store: {
        domain: store.shop_domain,
        name: store.shop_name
      }
    });

  } catch (error) {
    console.error('❌ [Sales API] Error fetching user sales:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sales'
    }, { status: 500 });
  }
}

