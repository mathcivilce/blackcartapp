import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Use service role key for admin operations (token validation, store creation)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Use anon key for auth operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, password, name, token } = await request.json();

    // Validate input
    if (!email || !password || !name || !token) {
      return NextResponse.json(
        { error: 'Email, password, name, and subscription token are required' },
        { status: 400 }
      );
    }

    // Validate subscription token (use admin client to bypass RLS)
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('subscription_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid subscription token' },
        { status: 400 }
      );
    }

    // Check if token is already used
    if (tokenData.used) {
      return NextResponse.json(
        { error: 'Subscription token has already been used' },
        { status: 400 }
      );
    }

    // Check if token has expired
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Subscription token has expired' },
        { status: 400 }
      );
    }

    // Verify email matches token email
    if (tokenData.email !== email) {
      return NextResponse.json(
        { error: 'Email does not match subscription' },
        { status: 400 }
      );
    }

    // Verify payment was completed
    if (!tokenData.stripe_customer_id || !tokenData.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Subscription payment not completed' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }
      console.error('Registration error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create account' },
        { status: 400 }
      );
    }

    // If registration was successful and session was created
    if (data.session && data.user) {
      // Mark token as used and associate with user (use admin client)
      await supabaseAdmin
        .from('subscription_tokens')
        .update({
          used: true,
          used_at: new Date().toISOString(),
          user_id: data.user.id
        })
        .eq('token', token);

      // Create store for user with Stripe details (use admin client)
      const { data: newStore, error: storeError } = await supabaseAdmin
        .from('stores')
        .insert({
          user_id: data.user.id,
          shop_domain: '', // Will be set later when they connect Shopify
          stripe_customer_id: tokenData.stripe_customer_id,
          subscription_status: 'active',
          email: email
        })
        .select()
        .single();

      if (!storeError && newStore) {
        // Create default settings for the new store (use admin client)
        await supabaseAdmin
          .from('settings')
          .insert({
            store_id: newStore.id,
            price: 490,
            toggle_color: '#2196F3',
            toggle_text: 'Shipping Protection',
            description: 'Protect your order from damage, loss, or theft during shipping.',
            enabled: true,
            cart_active: true
          });
      }

      // Set session cookie
      const cookieStore = await cookies();
      cookieStore.set('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      cookieStore.set('sb-refresh-token', data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}

