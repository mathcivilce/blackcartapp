import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required', valid: false },
        { status: 400 }
      );
    }

    // Check if token exists and is valid
    const { data: tokenData, error: tokenError } = await supabase
      .from('subscription_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid token'
      });
    }

    // Check if token is already used
    if (tokenData.used) {
      return NextResponse.json({
        valid: false,
        error: 'Token has already been used'
      });
    }

    // Check if token has expired
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'Token has expired'
      });
    }

    // Check if subscription was completed (has customer and subscription IDs)
    if (!tokenData.stripe_customer_id || !tokenData.stripe_subscription_id) {
      return NextResponse.json({
        valid: false,
        error: 'Payment not completed'
      });
    }

    return NextResponse.json({
      valid: true,
      email: tokenData.email,
      stripeCustomerId: tokenData.stripe_customer_id,
      stripeSubscriptionId: tokenData.stripe_subscription_id
    });

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { error: 'Validation failed', valid: false },
      { status: 500 }
    );
  }
}

