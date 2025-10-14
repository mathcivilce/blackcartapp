import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user from access token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { cart_active } = await request.json();
    
    console.log('🔧 Toggle cart API called by user:', user.id);
    console.log('🔧 New cart_active value:', cart_active);

    // Find the store associated with the user
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      console.error('Store not found for user:', user.id, storeError);
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    console.log('🔧 Found store:', store.id);

    // Update the cart_active setting for this store
    const { data: settings, error: updateError } = await supabase
      .from('settings')
      .update({ cart_active: cart_active })
      .eq('store_id', store.id)
      .select('cart_active')
      .single();

    if (updateError) {
      console.error('Error updating cart_active:', updateError);
      return NextResponse.json({ error: 'Failed to update cart activation' }, { status: 500 });
    }

    console.log('✅ Cart_active updated successfully:', settings?.cart_active);

    return NextResponse.json({ success: true, cart_active: settings?.cart_active });
  } catch (error) {
    console.error('Toggle cart error:', error);
    return NextResponse.json({ error: 'Failed to toggle cart' }, { status: 500 });
  }
}

