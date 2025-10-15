# Weekly Usage-Based Billing - Implementation Guide

## Overview

This system automatically charges users weekly for their protection product sales. Instead of a fixed subscription fee, users pay a 25% commission on each protection sale. Invoices are generated weekly and charged automatically via Stripe.

## How It Works

### 1. Sales Tracking
- Every time a customer purchases a protection product on Shopify, it's recorded in the `sales` table
- Each sale includes:
  - `protection_price`: The amount the customer paid (in cents)
  - `commission`: 25% of the protection price (what the platform charges)
  - `week`: Week identifier (e.g., "2025-W15")
  - `month`: Month identifier (e.g., "2025-01")

### 2. Weekly Invoice Generation

**Automated Process:**
- Runs every Monday at 2:00 AM UTC via `pg_cron`
- Edge Function: `generate-weekly-invoices`
- Processes all stores with Stripe customers

**What it does:**
1. Gets all stores with `stripe_customer_id`
2. For each store:
   - Checks if invoice already exists for the previous week
   - Fetches all sales from the previous week
   - Calculates total commission
   - Creates Stripe invoice
   - Saves invoice record to database

**Invoice Record:**
```typescript
{
  store_id: UUID,
  week: "2025-W15",
  week_start_date: "2025-04-07",
  week_end_date: "2025-04-13",
  sales_count: 25,
  commission_total: 2500, // $25.00 (25% of $100 in sales)
  total_amount: 2500,
  status: "pending",
  stripe_invoice_id: "in_xxxxx"
}
```

### 3. Automatic Charging

**Stripe handles payment:**
- Invoice is created and finalized automatically
- Stripe attempts to charge the customer's payment method
- Customer receives email with invoice

**Payment Status Updates:**
- `invoice.paid` webhook → Sets status to "paid", keeps cart active
- `invoice.payment_failed` webhook → Sets status to "failed", deactivates cart

### 4. Cart Enforcement

**Active Cart Requirements:**
- `subscription_status` must be `"active"` in `stores` table
- If payment fails, status changes to `"past_due"` → cart deactivates
- Once payment succeeds, status returns to `"active"` → cart reactivates

**Enforcement in `cart.js`:**
- Calls `/api/settings?store=${shop_domain}`
- If `subscription_status !== 'active'`, returns 403
- Cart doesn't initialize on Shopify store

## Database Schema

### Sales Table
```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  order_id TEXT NOT NULL,
  order_number TEXT,
  protection_price INTEGER NOT NULL,  -- In cents
  commission INTEGER NOT NULL,        -- 25% in cents
  month TEXT NOT NULL,                -- "2025-01"
  week TEXT,                          -- "2025-W15"
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Invoices Table
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  week TEXT,                          -- "2025-W15"
  week_start_date DATE,
  week_end_date DATE,
  month TEXT,
  subscription_fee INTEGER DEFAULT 0,
  commission_total INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  sales_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',      -- pending, paid, failed
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);
```

### Stores Table (relevant fields)
```sql
ALTER TABLE stores ADD COLUMN subscription_status TEXT DEFAULT 'active';
ALTER TABLE stores ADD COLUMN stripe_customer_id TEXT;
```

## API Endpoints

### `/api/invoices` (GET)
- Fetches all invoices for the current user's store
- Returns summary statistics

### `/api/invoices/trigger-generation` (POST)
- Manually triggers weekly invoice generation
- Useful for testing or catching up

## Edge Functions

### `generate-weekly-invoices`
**URL:** `https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/generate-weekly-invoices`

**Triggered by:**
- Cron job (every Monday at 2:00 AM UTC)
- Manual API call via `/api/invoices/trigger-generation`

**Process:**
1. Get previous week identifier
2. Fetch all stores with Stripe customers
3. For each store:
   - Check for existing invoice
   - Get sales for the week
   - Calculate commission total
   - Create Stripe invoice
   - Save to database

**Security:**
- Requires `Authorization: Bearer ${CRON_SECRET}` header
- Uses Supabase service role key for database access

### `stripe-webhook`
**URL:** `https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/stripe-webhook`

**Handles:**
- `invoice.paid`: Mark invoice as paid, keep cart active
- `invoice.payment_failed`: Mark invoice as failed, deactivate cart
- `customer.subscription.updated`: Update subscription status
- `customer.subscription.deleted`: Cancel subscription
- `checkout.session.completed`: Link Stripe customer to account

## Setup Instructions

### 1. Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Cron (optional)
CRON_SECRET=your_random_secret
```

### 2. Database Migrations
Already applied:
- ✅ `update_for_weekly_billing.sql` - Added `week` column to sales, updated invoices table
- ✅ `setup_weekly_invoice_cron.sql` - Set up cron job

### 3. Stripe Configuration

**In Stripe Dashboard:**
1. Go to Products → Create product
   - Name: "Weekly Commission"
   - Pricing: "Usage-based" or create invoices manually
   
2. Set up webhooks:
   - URL: `https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/stripe-webhook`
   - Events to listen to:
     - `invoice.paid`
     - `invoice.payment_failed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `checkout.session.completed`

### 4. Test the System

**Manual Invoice Generation:**
```bash
# Via API
curl -X POST https://your-app.com/api/invoices/trigger-generation \
  -H "Cookie: your-auth-cookie"

# Direct Edge Function
curl -X POST https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/generate-weekly-invoices \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Check Cron Jobs:**
```sql
-- In Supabase SQL Editor
SELECT * FROM cron.job WHERE jobname = 'weekly-invoice-generation';

-- Check cron job history
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-invoice-generation')
ORDER BY start_time DESC
LIMIT 10;
```

## Monitoring

### Invoice Dashboard
- URL: `/invoices` (in the app)
- Shows:
  - Total invoices
  - Paid/pending/failed counts
  - Total amounts
  - Individual invoice details
  - Manual generation button

### Database Queries

**Weekly sales summary:**
```sql
SELECT 
  week,
  COUNT(*) as sales_count,
  SUM(protection_price) as total_revenue,
  SUM(commission) as total_commission
FROM sales
WHERE store_id = 'your-store-id'
GROUP BY week
ORDER BY week DESC;
```

**Invoice status:**
```sql
SELECT 
  week,
  sales_count,
  commission_total,
  status,
  created_at,
  paid_at
FROM invoices
WHERE store_id = 'your-store-id'
ORDER BY created_at DESC;
```

**Failed payments:**
```sql
SELECT 
  stores.shop_domain,
  stores.email,
  invoices.week,
  invoices.commission_total,
  invoices.stripe_invoice_id
FROM invoices
JOIN stores ON invoices.store_id = stores.id
WHERE invoices.status = 'failed'
ORDER BY invoices.created_at DESC;
```

## Troubleshooting

### Issue: Invoices not generating
1. Check cron job status:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'weekly-invoice-generation';
   ```
2. Check edge function logs in Supabase Dashboard
3. Manually trigger: POST to `/api/invoices/trigger-generation`

### Issue: Payment fails but cart still active
1. Check webhook delivery in Stripe Dashboard
2. Verify `stripe-webhook` edge function is receiving events
3. Manually update:
   ```sql
   UPDATE stores 
   SET subscription_status = 'past_due' 
   WHERE stripe_customer_id = 'cus_xxx';
   ```

### Issue: Cart deactivated despite payment
1. Check invoice status:
   ```sql
   SELECT * FROM invoices WHERE stripe_invoice_id = 'in_xxx';
   ```
2. Check Stripe invoice status
3. Manually reactivate:
   ```sql
   UPDATE stores 
   SET subscription_status = 'active' 
   WHERE id = 'store-uuid';
   ```

## Commission Rate

Currently set to **25%** in `lib/shopify.ts`:

```typescript
export function calculateCommission(
  protectionPrice: number,
  commissionRate: number = 0.25
): number {
  return Math.round(protectionPrice * commissionRate);
}
```

To change the rate, update this function and redeploy.

## Future Enhancements

1. **Progressive commission rates**
   - Lower rates for high-volume stores
   - Configurable per store

2. **Grace period for failed payments**
   - Don't immediately deactivate cart
   - Send warning emails first

3. **Invoice previews**
   - Show upcoming invoice before it's charged
   - Allow users to add payment method before due date

4. **Automatic retries**
   - Retry failed payments after 3 days, 7 days
   - Only deactivate after multiple failures

5. **Email notifications**
   - Invoice generated
   - Payment succeeded
   - Payment failed
   - Cart deactivated

## Support

For issues or questions:
1. Check Supabase Edge Function logs
2. Check Stripe Dashboard → Developers → Webhooks
3. Review `/invoices` page in the app
4. Check database directly using SQL queries above

