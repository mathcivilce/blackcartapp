import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { cart_active } = await request.json();

    // Get user's store
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Update settings
    const { error: updateError } = await supabase
      .from('settings')
      .update({ cart_active })
      .eq('store_id', store.id);

    if (updateError) {
      console.error('Failed to update cart_active:', updateError);
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }

    return NextResponse.json({ success: true, cart_active });
  } catch (error) {
    console.error('Toggle cart error:', error);
    return NextResponse.json({ error: 'Failed to toggle cart' }, { status: 500 });
  }
}

