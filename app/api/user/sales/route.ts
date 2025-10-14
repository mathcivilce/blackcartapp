import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

/**
 * Get sales data for the authenticated user's store
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabaseClient = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    // Get user's store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, shop_domain, shop_name')
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
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

    if (salesError) {
      console.error('Error fetching sales:', salesError);
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
    console.error('❌ Error fetching user sales:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sales'
    }, { status: 500 });
  }
}

