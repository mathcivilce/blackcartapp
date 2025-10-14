import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    // Initialize Stripe inside the function to avoid build-time errors
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-09-30.clover',
    });

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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

    // Generate unique token for this subscription
    const token = crypto.randomBytes(32).toString('hex');

    // Get the base URL from the request
    const { origin } = new URL(request.url);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'BlackCart Monthly Subscription',
              description: 'Access to BlackCart - Shopify Cart Customization',
            },
            unit_amount: 100, // $1.00 in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 0, // No trial period
      },
      success_url: `${origin}/register?token=${token}`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        token: token,
        email: email,
      },
    });

    // Store the token in database (not marked as used yet)
    const { error: dbError } = await supabase
      .from('subscription_tokens')
      .insert({
        token: token,
        stripe_session_id: session.id,
        email: email,
        used: false,
      });

    if (dbError) {
      console.error('Error storing subscription token:', dbError);
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

