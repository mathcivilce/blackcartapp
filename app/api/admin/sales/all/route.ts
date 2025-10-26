import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Get aggregated sales data for all users - Admin only
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Admin All Sales API] Request received');
    
    // Authenticate user
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      console.log('❌ [Admin All Sales API] No access token found');
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
      console.log('❌ [Admin All Sales API] Invalid session:', userError);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid session. Please login again.'
      }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = user.user_metadata?.admin === true;
    
    if (!isAdmin) {
      console.log('❌ [Admin All Sales API] User is not admin:', user.email);
      return NextResponse.json({ 
        success: false,
        error: 'Access denied. Admin privileges required.'
      }, { status: 403 });
    }

    console.log('✅ [Admin All Sales API] Admin authenticated:', user.email);

    // Use service role client to fetch all sales
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Use aggregate queries to bypass the 1000 row limit
    // Query 1: Get total count
    const { count, error: countError } = await serviceClient
      .from('sales')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ [Admin All Sales API] Error fetching count:', countError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch sales count'
      }, { status: 500 });
    }

    // Query 2: Get all sales data for sum calculations (fetch in batches if needed)
    let allSales: any[] = [];
    let hasMore = true;
    let offset = 0;
    const batchSize = 1000;

    while (hasMore) {
      const { data: salesBatch, error: salesError } = await serviceClient
        .from('sales')
        .select('protection_price, commission')
        .order('created_at', { ascending: false })
        .range(offset, offset + batchSize - 1);

      if (salesError) {
        console.error('❌ [Admin All Sales API] Error fetching sales batch:', salesError);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch sales data'
        }, { status: 500 });
      }

      if (salesBatch && salesBatch.length > 0) {
        allSales = allSales.concat(salesBatch);
        offset += batchSize;
        hasMore = salesBatch.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    // Calculate aggregated summary from all fetched sales
    const totalSales = count || 0;
    const totalRevenue = allSales.reduce((sum, sale) => sum + (sale.protection_price || 0), 0);
    const totalCommission = allSales.reduce((sum, sale) => sum + (sale.commission || 0), 0);
    const userCommission = totalRevenue - totalCommission;

    const summary = {
      totalSales,
      totalRevenue,
      userCommission,
      platformFee: totalCommission
    };

    console.log('✅ [Admin All Sales API] Returning aggregated data:', summary, `(fetched ${allSales.length} sales in batches)`);

    return NextResponse.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('❌ [Admin All Sales API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sales'
    }, { status: 500 });
  }
}

