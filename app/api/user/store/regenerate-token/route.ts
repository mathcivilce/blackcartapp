import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

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

    // Get user's store
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Generate new token
    const newToken = randomUUID();

    // Update store with new token
    const { data: updatedStore, error: updateError } = await supabase
      .from('stores')
      .update({ access_token: newToken })
      .eq('id', store.id)
      .select('access_token')
      .single();

    if (updateError) {
      console.error('Failed to regenerate token:', updateError);
      return NextResponse.json({ error: 'Failed to regenerate token' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      access_token: updatedStore.access_token
    });
  } catch (error) {
    console.error('Regenerate token error:', error);
    return NextResponse.json({ error: 'Failed to regenerate token' }, { status: 500 });
  }
}

