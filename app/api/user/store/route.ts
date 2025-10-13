import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's store with settings
    const { data: store, error } = await supabase
      .from('stores')
      .select('*, settings(*)')
      .eq('user_id', userId)
      .single();

    if (error) {
      // No store found - this is ok, will be created on first save
      return NextResponse.json({ store: null }, { status: 404 });
    }

    // Transform to include single settings object
    const storeData = {
      ...store,
      settings: store.settings?.[0] || null
    };

    return NextResponse.json({ store: storeData });
  } catch (error) {
    console.error('Get store error:', error);
    return NextResponse.json({ error: 'Failed to get store' }, { status: 500 });
  }
}

