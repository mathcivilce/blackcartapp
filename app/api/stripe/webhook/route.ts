import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Update the subscription token with customer and subscription IDs
        const { error: updateError } = await supabase
          .from('subscription_tokens')
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq('stripe_session_id', session.id);

        if (updateError) {
          console.error('Error updating subscription token:', updateError);
        }

        console.log('Checkout session completed:', session.id);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update store subscription status if user is already registered
        const { data: tokenData } = await supabase
          .from('subscription_tokens')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (tokenData && tokenData.user_id) {
          const { data: storeData } = await supabase
            .from('stores')
            .select('id')
            .eq('user_id', tokenData.user_id)
            .single();

          if (storeData) {
            const status = subscription.status === 'active' ? 'active' : 
                          subscription.status === 'past_due' ? 'past_due' : 'canceled';
            
            await supabase
              .from('stores')
              .update({ subscription_status: status })
              .eq('id', storeData.id);
          }
        }

        console.log('Subscription status updated:', subscription.id, subscription.status);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

