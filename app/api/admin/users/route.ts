import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Get all users - Admin only
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Admin Users API] Request received');
    
    // Authenticate user
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      console.log('❌ [Admin Users API] No access token found');
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
      console.log('❌ [Admin Users API] Invalid session:', userError);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid session. Please login again.'
      }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = user.user_metadata?.admin === true;
    
    if (!isAdmin) {
      console.log('❌ [Admin Users API] User is not admin:', user.email);
      return NextResponse.json({ 
        success: false,
        error: 'Access denied. Admin privileges required.'
      }, { status: 403 });
    }

    console.log('✅ [Admin Users API] Admin authenticated:', user.email);

    // Use service role client to fetch all users
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all users with their stores
    const { data: users, error: usersError } = await serviceClient
      .from('stores')
      .select(`
        user_id,
        shop_domain,
        shop_name,
        email,
        subscription_status,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ [Admin Users API] Error fetching users:', usersError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch users'
      }, { status: 500 });
    }

    // Get user emails from auth.users
    const userIds = users?.map(u => u.user_id).filter(Boolean) || [];
    const { data: authUsers } = await serviceClient.auth.admin.listUsers();

    // Map user_id to email
    const userEmailMap = new Map(
      authUsers.users.map(u => [u.id, u.email])
    );

    // Combine data
    const usersWithEmails = users?.map(store => ({
      userId: store.user_id,
      email: store.user_id ? userEmailMap.get(store.user_id) : store.email,
      shopDomain: store.shop_domain,
      shopName: store.shop_name,
      subscriptionStatus: store.subscription_status,
      createdAt: store.created_at
    })) || [];

    console.log('✅ [Admin Users API] Returning users:', usersWithEmails.length);

    return NextResponse.json({
      success: true,
      users: usersWithEmails
    });

  } catch (error) {
    console.error('❌ [Admin Users API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users'
    }, { status: 500 });
  }
}

