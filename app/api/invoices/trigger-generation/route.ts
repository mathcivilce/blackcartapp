import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Admin-only endpoint to manually trigger weekly invoice generation
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            cookie: cookieStore.toString(),
          },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call the edge function
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-weekly-invoices`;
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to trigger invoice generation', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice generation triggered successfully',
      results: data
    });
  } catch (error) {
    console.error('Error triggering invoice generation:', error);
    return NextResponse.json(
      { error: 'An error occurred while triggering invoice generation' },
      { status: 500 }
    );
  }
}

