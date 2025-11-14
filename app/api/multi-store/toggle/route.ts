import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// POST /api/multi-store/toggle - Enable/disable multi-store checkout feature
export async function POST(request: NextRequest) {
  try {
    const { enabled } = await request.json();

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'Invalid request'
      }, { status: 400 });
    }

    // Authenticate user
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
      return NextResponse.json({ 
        success: false,
        error: 'Invalid session'
      }, { status: 401 });
    }

    // Get user's store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      return NextResponse.json({
        success: false,
        error: 'No store found'
      }, { status: 404 });
    }

    // Update settings
    const { error: updateError } = await supabase
      .from('settings')
      .update({ multi_store_enabled: enabled })
      .eq('store_id', store.id);

    if (updateError) {
      console.error('Error updating multi_store_enabled:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update settings'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      enabled
    });

  } catch (error) {
    console.error('Error toggling multi-store:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to toggle feature'
    }, { status: 500 });
  }
}

