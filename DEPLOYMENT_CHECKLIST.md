# Weekly Billing Deployment Checklist

## ✅ Completed Steps

### Database
- [x] Applied migration: `update_for_weekly_billing.sql`
  - Added `week` column to `sales` table
  - Updated `invoices` table for weekly billing
  - Added week indexes

- [x] Applied migration: `setup_weekly_invoice_cron.sql`
  - Enabled `pg_cron` extension
  - Created cron job for weekly invoice generation (Mondays at 2 AM UTC)

### Edge Functions
- [x] Deployed `generate-weekly-invoices`
  - Generates invoices for previous week
  - Creates Stripe invoices automatically
  - Saves records to database

- [x] Updated `stripe-webhook`
  - Handles `invoice.paid` → mark paid, keep cart active
  - Handles `invoice.payment_failed` → mark failed, deactivate cart
  - Handles subscription events

### Backend API
- [x] Created `/api/invoices` (GET)
  - Fetches user's invoices
  - Returns summary statistics

- [x] Created `/api/invoices/trigger-generation` (POST)
  - Manually trigger invoice generation
  - For testing and manual runs

- [x] Updated `/api/shopify/sync-orders`
  - Now includes `week` identifier when recording sales
  - Uses `getWeekIdentifier()` helper

### Frontend
- [x] Created `/invoices` page
  - Shows all invoices
  - Summary cards (total, paid, pending, failed)
  - Manual generation button
  - Links to Stripe dashboard

- [x] Updated dashboard layout
  - Added "Invoices" menu item

### Libraries
- [x] Created `lib/billing.ts`
  - `getWeekIdentifier()` - Get current week
  - `getPreviousWeekIdentifier()` - Get last week
  - `getWeekDates()` - Get week start/end
  - `formatCurrency()` - Format cents to dollars
  - `formatWeekDisplay()` - Format week for UI

### Documentation
- [x] Created `WEEKLY_BILLING_GUIDE.md`
  - Complete system overview
  - Setup instructions
  - Troubleshooting guide
  - Monitoring queries

## 🔄 Next Steps (To Complete Deployment)

### 1. Stripe Configuration
- [ ] Set up webhook endpoint in Stripe Dashboard
  - URL: `https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/stripe-webhook`
  - Events:
    - `invoice.paid`
    - `invoice.payment_failed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `checkout.session.completed`

### 2. Environment Variables
- [ ] Verify these are set in Supabase:
  - `STRIPE_SECRET_KEY` (for edge functions)
  - `STRIPE_WEBHOOK_SECRET` (for webhook verification)
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `CRON_SECRET` (optional, for securing cron endpoint)

### 3. Testing

#### Test Invoice Generation:
```bash
# 1. Manual trigger via API
curl -X POST https://your-app.com/api/invoices/trigger-generation \
  -H "Cookie: your-auth-cookie"

# 2. Direct edge function call
curl -X POST https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/generate-weekly-invoices \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

#### Verify Cron Job:
```sql
-- Check cron job exists
SELECT * FROM cron.job WHERE jobname = 'weekly-invoice-generation';

-- Check cron job runs
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-invoice-generation')
ORDER BY start_time DESC;
```

#### Test Payment Flow:
1. Make a test Shopify order with protection
2. Wait for order sync (or trigger manually)
3. Trigger invoice generation
4. Check Stripe dashboard for invoice
5. Mark invoice as paid in Stripe
6. Verify webhook updates status to "paid"
7. Verify cart stays active

#### Test Failed Payment:
1. Create test invoice
2. Mark as payment failed in Stripe
3. Verify webhook updates status to "failed"
4. Verify cart deactivates (subscription_status = 'past_due')

### 4. Monitoring Setup

#### Supabase Dashboard:
- [ ] Monitor edge function logs
- [ ] Set up alerts for errors
- [ ] Check cron job execution history

#### Stripe Dashboard:
- [ ] Monitor webhook deliveries
- [ ] Check for failed events
- [ ] Review invoices being created

#### Database Queries:
```sql
-- Failed invoices requiring attention
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

-- Weekly revenue
SELECT 
  week,
  COUNT(DISTINCT store_id) as stores,
  COUNT(*) as total_sales,
  SUM(commission) as total_commission
FROM sales
GROUP BY week
ORDER BY week DESC
LIMIT 8;

-- Stores with past_due status
SELECT 
  shop_domain,
  email,
  subscription_status,
  stripe_customer_id
FROM stores
WHERE subscription_status = 'past_due';
```

### 5. Deploy Frontend
- [ ] Run `npm run build` to verify no errors
- [ ] Deploy to Netlify/Vercel
- [ ] Test `/invoices` page
- [ ] Test manual generation button

### 6. User Communication
- [ ] Update user documentation
- [ ] Notify users about new weekly billing
- [ ] Explain how charges work
- [ ] Provide invoice access instructions

## 🧪 Testing Scenarios

### Scenario 1: First Week with Sales
1. Store has 10 protection sales totaling $50.00
2. Commission = $12.50 (25%)
3. Monday at 2 AM: Invoice generated
4. Stripe charges $12.50
5. Payment succeeds → status = "paid", cart stays active

### Scenario 2: Week with No Sales
1. Store has 0 protection sales
2. Monday at 2 AM: No invoice created (skipped)
3. Cart stays active (no charge)

### Scenario 3: Payment Failure
1. Store has sales, invoice generated
2. Stripe charge fails (insufficient funds)
3. Webhook: status = "failed"
4. Store subscription_status = "past_due"
5. Cart.js stops working (403 response)

### Scenario 4: Recovery from Failure
1. User updates payment method in Stripe
2. Stripe retries payment
3. Payment succeeds
4. Webhook: status = "paid"
5. Store subscription_status = "active"
6. Cart.js works again

## 📋 Final Verification

Before going live:
- [ ] All migrations applied successfully
- [ ] All edge functions deployed
- [ ] Cron job scheduled and verified
- [ ] Stripe webhooks configured
- [ ] Frontend deployed with `/invoices` page
- [ ] Test invoice generation works
- [ ] Test webhook updates work
- [ ] Test cart deactivation on failed payment
- [ ] Test cart reactivation on successful payment
- [ ] Documentation complete
- [ ] Monitoring in place

## 🚨 Rollback Plan

If issues arise:

1. **Disable cron job:**
```sql
SELECT cron.unschedule('weekly-invoice-generation');
```

2. **Prevent cart deactivation:**
```sql
-- Keep all carts active temporarily
UPDATE stores SET subscription_status = 'active';
```

3. **Revert to old billing:**
- Remove webhook handlers for `invoice.paid/failed`
- Keep manual charging process

4. **Database rollback:**
```sql
-- If needed, remove week column (not recommended)
ALTER TABLE sales DROP COLUMN IF EXISTS week;
```

## 📞 Support Contacts

- Supabase Dashboard: https://supabase.com/dashboard
- Stripe Dashboard: https://dashboard.stripe.com
- Netlify Dashboard: https://app.netlify.com
- Project Repository: [Your repo URL]

---

**Status:** Ready for deployment 🚀
**Last Updated:** October 15, 2025

