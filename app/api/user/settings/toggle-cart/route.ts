import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
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

