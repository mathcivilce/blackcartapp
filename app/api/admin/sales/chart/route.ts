import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Get aggregated sales chart data for all users - Admin only
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Admin Sales Chart] Request received');
    
    // Authenticate user
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      console.log('❌ [Admin Sales Chart] No access token found');
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
      console.log('❌ [Admin Sales Chart] Invalid session:', userError);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid session. Please login again.'
      }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = user.user_metadata?.admin === true;
    
    if (!isAdmin) {
      console.log('❌ [Admin Sales Chart] User is not admin:', user.email);
      return NextResponse.json({ 
        success: false,
        error: 'Access denied. Admin privileges required.'
      }, { status: 403 });
    }

    console.log('✅ [Admin Sales Chart] Admin authenticated:', user.email);

    // Use service role client to fetch all sales
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all sales in batches to bypass the 1000 row limit
    let allSales: any[] = [];
    let hasMore = true;
    let offset = 0;
    const batchSize = 1000;

    while (hasMore) {
      const { data: salesBatch, error: salesError } = await serviceClient
        .from('sales')
        .select('protection_price, commission, created_at')
        .order('created_at', { ascending: true })
        .range(offset, offset + batchSize - 1);

      if (salesError) {
        console.error('❌ [Admin Sales Chart] Error fetching sales batch:', salesError);
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

    console.log('✅ [Admin Sales Chart] Returning data:', { 
      totalSales: allSales.length,
      fetchedInBatches: offset > batchSize
    });

    return NextResponse.json({
      success: true,
      sales: allSales
    });

  } catch (error) {
    console.error('❌ [Admin Sales Chart] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch chart data'
    }, { status: 500 });
  }
}

