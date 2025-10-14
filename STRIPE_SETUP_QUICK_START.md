# Stripe Integration - Quick Start

This is a quick reference for setting up the Stripe integration in BlackCart.

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Stripe API Keys

1. Sign up at [stripe.com](https://stripe.com) (or log in)
2. Go to **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Click "Reveal test key" and copy your **Secret key** (starts with `sk_test_`)

### Step 2: Set Up Environment Variables

Create or update `.env.local` in your project root:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Set Up Webhook (Local Development)

Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (with Scoop)
scoop install stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

Login to Stripe:
```bash
stripe login
```

Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Important:** Copy the webhook signing secret from the output (starts with `whsec_`) and add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Step 4: Start Your App

```bash
npm run dev
```

Visit: [http://localhost:3000/pricing](http://localhost:3000/pricing)

## 🧪 Test the Integration

### Test Payment

1. Go to `http://localhost:3000/pricing`
2. Enter any email: `test@example.com`
3. Click **"Start Your Subscription"**
4. On Stripe Checkout page, use test card:
   - **Card number:** `4242 4242 4242 4242`
   - **Expiry:** Any future date (e.g., `12/25`)
   - **CVC:** Any 3 digits (e.g., `123`)
   - **ZIP:** Any 5 digits (e.g., `12345`)
5. Click **Pay**
6. You'll be redirected to registration page
7. Create your account!

## 📋 Verification Checklist

- [ ] Can access `/pricing` page
- [ ] Clicking "Subscribe" redirects to Stripe Checkout
- [ ] Test payment completes successfully
- [ ] Redirected to `/register?token=...`
- [ ] Can create account
- [ ] Logged in and redirected to dashboard

## 🔧 Common Issues

### "Invalid API Key"
- ✅ Check `.env.local` has correct `STRIPE_SECRET_KEY`
- ✅ Restart your dev server after adding env variables

### "Webhook signature verification failed"
- ✅ Make sure Stripe CLI is running (`stripe listen...`)
- ✅ Copy the webhook secret from CLI output to `.env.local`
- ✅ Restart dev server after updating env variables

### "Invalid subscription token"
- ✅ Make sure webhook is running (Stripe CLI)
- ✅ Wait a few seconds after payment before checking
- ✅ Check Stripe CLI output for webhook events

### Can't access registration page
- ✅ Make sure you completed payment successfully
- ✅ Check URL has `?token=` parameter
- ✅ Token might have expired (valid for 24 hours)

## 🚀 Production Setup

When ready for production:

1. **Switch to Live Keys:**
   - In Stripe Dashboard, toggle from "Test mode" to "Live mode"
   - Get live API keys (start with `pk_live_` and `sk_live_`)
   - Update `.env` in production with live keys

2. **Set Up Production Webhook:**
   - Go to **Developers** → **Webhooks** → **Add endpoint**
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events: Select `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook signing secret to production env

3. **Update App URL:**
   ```env
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

## 💰 Pricing

Current subscription: **$1/month** (no trial)

To change the price, edit `app/api/stripe/create-checkout/route.ts`:
```typescript
unit_amount: 100, // Price in cents ($1.00)
```

To add a trial period:
```typescript
subscription_data: {
  trial_period_days: 7, // 7-day trial
},
```

## 📚 Next Steps

- View full documentation: `STRIPE_INTEGRATION_GUIDE.md`
- Test subscription cancellation in Stripe Dashboard
- Customize pricing page styling
- Add custom success/cancel pages

## 🆘 Need Help?

1. Check Stripe Dashboard → Developers → Logs
2. Check Stripe CLI output for webhook events
3. Check browser console for errors
4. Read full guide: `STRIPE_INTEGRATION_GUIDE.md`

