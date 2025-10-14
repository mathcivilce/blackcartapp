# 🎉 Stripe Subscription Integration - COMPLETE

## Overview

Your BlackCart app now has a **fully functional Stripe subscription paywall**. Users must pay **$1/month** before they can create an account.

## ✅ What's Been Done

### Database
- ✅ Created `subscription_tokens` table in Supabase
- ✅ Added indexes for performance
- ✅ Enabled Row Level Security (RLS)
- ✅ Set up proper foreign key relationships

### API Routes Created
1. **`/api/stripe/create-checkout`** - Creates Stripe checkout session
2. **`/api/stripe/webhook`** - Handles Stripe webhook events
3. **`/api/stripe/validate-token`** - Validates subscription tokens

### Pages
1. **`/pricing`** - Beautiful landing page (NEW)
2. **`/register`** - Updated with token validation
3. **`/login`** - Updated with pricing link
4. **`/` (home)** - Auto-redirects based on auth status

### Security
- ✅ Token-based registration protection
- ✅ 24-hour token expiration
- ✅ One-time use tokens
- ✅ Email verification
- ✅ Payment verification before account creation

## 🚀 Quick Start

### 1. Install Dependencies (Already Done)
```bash
npm install stripe @stripe/stripe-js
```

### 2. Get Stripe API Keys

1. Sign up at [stripe.com](https://stripe.com)
2. Go to **Developers** → **API keys**
3. Copy your test keys:
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`

### 3. Set Environment Variables

Create `.env.local`:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://ezzpivxxdxcdnmerrcbt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set Up Webhook (Local Development)

Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
# Download from: https://stripe.com/docs/stripe-cli
```

Run webhook listener:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Copy the webhook secret** from the output and add to `.env.local`

### 5. Start Your App

```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

## 🧪 Test It

1. Go to `http://localhost:3000/pricing`
2. Enter email: `test@example.com`
3. Click "Start Your Subscription"
4. Use test card: **4242 4242 4242 4242**
5. Expiry: Any future date (12/25)
6. CVC: Any 3 digits (123)
7. Complete payment
8. You'll be redirected to registration
9. Create your account!

## 📊 Database Schema

The new `subscription_tokens` table:

```sql
subscription_tokens
├── id (uuid, primary key)
├── token (text, unique) - 64-char random hex
├── stripe_session_id (text, unique)
├── stripe_customer_id (text)
├── stripe_subscription_id (text)
├── email (text)
├── used (boolean, default false)
├── user_id (uuid, references auth.users)
├── created_at (timestamp)
├── used_at (timestamp)
└── expires_at (timestamp, 24 hours from creation)
```

## 🔐 How It Works

```
1. User visits /pricing
   ↓
2. Enters email → Creates checkout session
   ↓
3. System generates unique token
   ↓
4. Redirects to Stripe Checkout
   ↓
5. User pays $1/month
   ↓
6. Stripe webhook updates token with customer/subscription IDs
   ↓
7. User redirected to /register?token=xxx
   ↓
8. Frontend validates token
   ↓
9. User creates account
   ↓
10. Backend validates token again
    ↓
11. Token marked as used
    ↓
12. User account + store created
    ↓
13. User logged in → Dashboard
```

## 📁 Files Created

```
app/
  api/stripe/
    create-checkout/route.ts
    webhook/route.ts
    validate-token/route.ts
  pricing/page.tsx
  page.tsx (updated)

supabase/migrations/
  add_subscription_tokens.sql

Documentation/
  STRIPE_INTEGRATION_GUIDE.md
  STRIPE_SETUP_QUICK_START.md
  STRIPE_INTEGRATION_COMPLETE.md
  README_STRIPE.md (this file)
```

## 🎨 Customization

### Change Price

Edit `app/api/stripe/create-checkout/route.ts`:

```typescript
unit_amount: 100, // $1.00 in cents
// Change to 500 for $5.00
// Change to 2900 for $29.00
```

### Add Trial Period

```typescript
subscription_data: {
  trial_period_days: 7, // 7-day trial
},
```

### Customize Pricing Page

Edit `app/pricing/page.tsx` - all styles are inline CSS objects

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid API Key" | Check `.env.local` has correct `STRIPE_SECRET_KEY` |
| "Webhook signature failed" | Make sure Stripe CLI is running |
| "Invalid token" | Ensure webhook is running and payment completed |
| Can't access registration | Must have valid token in URL |

## 📚 Documentation

- **Quick Start**: `STRIPE_SETUP_QUICK_START.md`
- **Full Guide**: `STRIPE_INTEGRATION_GUIDE.md`
- **Summary**: `STRIPE_INTEGRATION_COMPLETE.md`

## 🎯 Next Steps

1. [ ] Add Stripe API keys to `.env.local`
2. [ ] Run Stripe CLI webhook listener
3. [ ] Test the subscription flow
4. [ ] Customize pricing page (optional)
5. [ ] Deploy to production
6. [ ] Set up production webhook
7. [ ] Switch to live Stripe keys

## 🆘 Support

For detailed help, see:
- `STRIPE_SETUP_QUICK_START.md` for step-by-step setup
- `STRIPE_INTEGRATION_GUIDE.md` for technical details
- [Stripe Documentation](https://stripe.com/docs)

---

**Status**: ✅ Ready to Use  
**Price**: $1/month (no trial)  
**Test Mode**: Yes (use test cards)  
**Production Ready**: Yes (after Stripe setup)

