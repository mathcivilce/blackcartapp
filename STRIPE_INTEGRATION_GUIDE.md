# Stripe Integration Guide

This guide explains how the Stripe subscription integration works in Cartbase.

## Overview

Cartbase now includes a subscription paywall where users must pay $1/month before they can create an account. The integration ensures that:

1. Users must subscribe via Stripe Checkout
2. Only paying subscribers can access the registration page
3. Tokens prevent unauthorized account creation
4. Subscriptions are tracked and linked to user accounts

## Architecture

### Database Schema

A new table `subscription_tokens` has been added:

```sql
CREATE TABLE subscription_tokens (
  id UUID PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  email TEXT NOT NULL,
  used BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours')
);
```

### Flow Diagram

```
1. User visits /pricing
   ↓
2. User enters email and clicks "Subscribe"
   ↓
3. API creates Stripe checkout session + generates token
   ↓
4. User redirected to Stripe Checkout
   ↓
5. User completes payment ($1/month)
   ↓
6. Stripe webhook updates token with customer/subscription IDs
   ↓
7. User redirected to /register?token=xxx
   ↓
8. Registration page validates token
   ↓
9. User creates account
   ↓
10. Token marked as used, user account created, store created
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install stripe @stripe/stripe-js
```

### 2. Configure Environment Variables

Add the following to your `.env.local`:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your API keys from Developers → API keys
3. Use test mode keys for development

### 4. Configure Stripe Webhook

1. Go to Developers → Webhooks in Stripe Dashboard
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

For local development, use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 5. Deploy Database Migration

The migration has already been applied to create the `subscription_tokens` table.

## API Routes

### POST `/api/stripe/create-checkout`

Creates a Stripe checkout session for subscription.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/xxx"
}
```

### POST `/api/stripe/webhook`

Handles Stripe webhook events. Automatically updates subscription tokens and store subscription status.

**Events Handled:**
- `checkout.session.completed` - Links customer and subscription to token
- `customer.subscription.updated` - Updates store subscription status
- `customer.subscription.deleted` - Marks subscription as canceled

### POST `/api/stripe/validate-token`

Validates a subscription token before registration.

**Request Body:**
```json
{
  "token": "abc123..."
}
```

**Response:**
```json
{
  "valid": true,
  "email": "user@example.com",
  "stripeCustomerId": "cus_xxx",
  "stripeSubscriptionId": "sub_xxx"
}
```

## Pages

### `/pricing`

Landing page where users:
- Enter their email
- Click "Start Your Subscription"
- Get redirected to Stripe Checkout

### `/register?token=xxx`

Registration page that:
- Validates the subscription token
- Pre-fills email from subscription
- Allows user to create account
- Marks token as used after successful registration

## User Registration Flow

1. **Token Validation**: On page load, the registration page validates the token
2. **Email Lock**: The email field is pre-filled and disabled to ensure it matches the subscription
3. **Account Creation**: User fills in name and password
4. **Token Marking**: After successful registration, the token is marked as used
5. **Store Creation**: A store record is created with the Stripe customer ID

## Security Features

### Token Security
- Tokens are 64-character random hex strings
- Tokens expire after 24 hours
- Tokens can only be used once
- Tokens are validated on both frontend and backend

### Payment Verification
- Token must have valid Stripe customer ID
- Token must have valid Stripe subscription ID
- Email must match between subscription and registration

### Registration Protection
- Cannot access registration page without valid token
- Cannot register with used or expired token
- Cannot register with mismatched email

## Testing

### Test Mode

Use Stripe test mode for development:

1. Use test API keys (starting with `sk_test_` and `pk_test_`)
2. Use test card numbers from [Stripe Testing](https://stripe.com/docs/testing):
   - Success: `4242 4242 4242 4242`
   - Failure: `4000 0000 0000 0002`

### Testing Flow

1. Go to `http://localhost:3000/pricing`
2. Enter test email: `test@example.com`
3. Click "Start Your Subscription"
4. On Stripe Checkout, use test card: `4242 4242 4242 4242`
5. Use any future expiry date and any CVC
6. Complete payment
7. You should be redirected to `/register?token=xxx`
8. Complete registration
9. Verify you're logged in and redirected to dashboard

## Production Deployment

### Pre-deployment Checklist

- [ ] Replace test Stripe keys with live keys
- [ ] Update `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Configure production webhook endpoint in Stripe
- [ ] Test the entire flow in production
- [ ] Monitor webhook deliveries in Stripe Dashboard

### Monitoring

Monitor these in Stripe Dashboard:
1. **Payments** - Track successful subscriptions
2. **Customers** - View customer list
3. **Webhooks** - Check webhook delivery status
4. **Logs** - Debug any issues

## Subscription Management

### Updating Subscription Status

The webhook automatically updates the `stores` table when:
- Subscription is updated
- Subscription is canceled
- Payment fails (past_due status)

Possible subscription statuses:
- `active` - Subscription is active
- `past_due` - Payment failed
- `canceled` - Subscription canceled

### Handling Failed Payments

When a payment fails:
1. Stripe sends `customer.subscription.updated` webhook
2. Store status is updated to `past_due`
3. You can add logic to restrict features for past_due users

## Customization

### Changing Subscription Price

Edit `app/api/stripe/create-checkout/route.ts`:

```typescript
unit_amount: 100, // Change this value (in cents)
```

### Adding Trial Period

Edit `app/api/stripe/create-checkout/route.ts`:

```typescript
subscription_data: {
  trial_period_days: 7, // Add trial period
},
```

### Customizing Success/Cancel URLs

Edit `app/api/stripe/create-checkout/route.ts`:

```typescript
success_url: `${origin}/custom-success?token=${token}`,
cancel_url: `${origin}/custom-cancel`,
```

## Troubleshooting

### Token not found
- Check that webhook is properly configured
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check Stripe Dashboard → Webhooks for failed deliveries

### Registration fails with "Invalid token"
- Ensure token is in URL: `/register?token=xxx`
- Check token hasn't expired (24 hours)
- Verify token hasn't been used already

### Webhook signature verification failed
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Ensure raw body is being sent to webhook
- Check Stripe CLI is forwarding correctly in development

### Payment succeeds but token not updated
- Check Supabase logs for errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` has correct permissions
- Check webhook event in Stripe Dashboard

## Support

For issues:
1. Check Stripe Dashboard → Webhooks for delivery status
2. Check application logs for errors
3. Verify all environment variables are set correctly
4. Test with Stripe test mode first

## Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Cards](https://stripe.com/docs/testing)

