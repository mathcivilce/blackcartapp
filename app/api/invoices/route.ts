import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Invoices API] Request received');
    
    // Authenticate user
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      console.log('❌ [Invoices API] No access token found');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
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

    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      console.log('❌ [Invoices API] Invalid session:', authError);
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    console.log('✅ [Invoices API] User authenticated:', user.id);

    // Get user's store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    console.log('🏪 [Invoices API] Store query:', { store, storeError });

    if (storeError || !store) {
      console.log('❌ [Invoices API] Store not found');
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Get invoices for this store
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false });

    console.log('📄 [Invoices API] Invoices query:', { invoicesCount: invoices?.length, invoicesError });

    if (invoicesError) {
      console.error('❌ [Invoices API] Error fetching invoices:', invoicesError);
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      );
    }

    // Calculate summary
    const summary = {
      total: invoices?.length || 0,
      paid: invoices?.filter(i => i.status === 'paid').length || 0,
      pending: invoices?.filter(i => i.status === 'pending').length || 0,
      failed: invoices?.filter(i => i.status === 'failed').length || 0,
      totalAmount: invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
      paidAmount: invoices?.filter(i => i.status === 'paid')
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
    };

    console.log('✅ [Invoices API] Returning data:', { invoicesCount: invoices?.length, summary });

    return NextResponse.json({
      success: true,
      invoices: invoices || [],
      summary
    });
  } catch (error) {
    console.error('❌ [Invoices API] Error in invoices API:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching invoices' },
      { status: 500 }
    );
  }
}

