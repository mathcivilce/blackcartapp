# Stripe Subscription Sync - Daily Cron Job

## Overview

Automatic daily synchronization of Stripe subscription statuses to ensure cart access is properly enforced.

## ✅ What's Deployed

### 1. **Supabase Edge Function**
- **Name:** `sync-stripe-subscriptions`
- **Status:** ACTIVE
- **URL:** `https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/sync-stripe-subscriptions`

### 2. **Database Migration**
- Added `last_subscription_check` column to `stores` table
- Enabled `pg_cron` extension
- Created daily cron job: `daily-stripe-subscription-sync`

### 3. **Cron Schedule**
- **Runs:** Daily at 3:00 AM UTC
- **Job Name:** `daily-stripe-subscription-sync`

## 🔧 Configuration Required

### Step 1: Set Supabase Secrets

Add these secrets to your Supabase project:

```bash
# If not already set
STRIPE_SECRET_KEY=sk_live_your_key_here
SUPABASE_URL=https://ezzpivxxdxcdnmerrcbt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=generate_a_random_secret_here
```

**Via Supabase Dashboard:**
1. Go to Project Settings → Edge Functions → Manage secrets
2. Add each secret

**Via CLI:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set SUPABASE_URL=https://ezzpivxxdxcdnmerrcbt.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
supabase secrets set CRON_SECRET=$(openssl rand -hex 32)
```

### Step 2: Configure pg_cron Authorization

The cron job needs to pass the service role key to the edge function. You need to set it as a PostgreSQL setting:

**Option A: Via Supabase SQL Editor**
```sql
-- Set the service role key as a database setting
ALTER DATABASE postgres SET app.settings.service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Option B: Update the cron job to use a fixed key**
```sql
-- Delete existing job
SELECT cron.unschedule('daily-stripe-subscription-sync');

-- Create new job with hardcoded auth (secure since it's internal)
SELECT cron.schedule(
  'daily-stripe-subscription-sync',
  '0 3 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/sync-stripe-subscriptions',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY_HERE"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

## 🧪 Testing

### Manual Test (via HTTP)

Test the edge function directly:

```bash
curl -X POST \
  'https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/sync-stripe-subscriptions' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

### Check Cron Job Status

```sql
-- View all cron jobs
SELECT * FROM cron.job;

-- View cron job run history
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-stripe-subscription-sync')
ORDER BY start_time DESC 
LIMIT 10;
```

### View Edge Function Logs

1. Go to Supabase Dashboard
2. Edge Functions → sync-stripe-subscriptions → Logs
3. Check for execution logs

## 📊 How It Works

### 1. **Fetch Stores**
- Gets all stores with `stripe_customer_id` set

### 2. **Query Stripe**
- For each store, fetches current subscription status from Stripe API
- Handles all subscription statuses: active, past_due, canceled, etc.

### 3. **Update Database**
- Compares Stripe status with database status
- Updates `subscription_status` if changed
- Updates `last_subscription_check` timestamp

### 4. **Status Mapping**

| Stripe Status | Database Status |
|--------------|----------------|
| `active`, `trialing` | `active` |
| `past_due`, `unpaid` | `past_due` |
| `canceled`, `incomplete`, `paused` | `canceled` |
| No subscription found | `canceled` |

### 5. **Enforcement**
- `/api/settings` checks `subscription_status`
- If not `active`, returns 403 and cart doesn't load
- User's cart stops working immediately

## 📈 Monitoring

### Check Sync Results

Query the logs:
```sql
-- Check when stores were last synced
SELECT 
  shop_domain, 
  subscription_status, 
  last_subscription_check,
  stripe_customer_id
FROM stores 
WHERE stripe_customer_id IS NOT NULL
ORDER BY last_subscription_check DESC;
```

### Failed Syncs

The edge function returns detailed error information:
```json
{
  "success": true,
  "results": {
    "total_checked": 10,
    "updated": 2,
    "failed": 1,
    "errors": [
      {
        "shop_domain": "example.myshopify.com",
        "error": "Stripe API error"
      }
    ]
  }
}
```

## 🔄 Manual Sync Trigger

To manually trigger a sync (for testing or after fixing issues):

```bash
curl -X POST \
  'https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/sync-stripe-subscriptions' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'
```

Or via SQL:
```sql
-- Trigger the cron job immediately
SELECT cron.schedule('manual-sync-now', '* * * * *', 
  $$ SELECT net.http_post(...) $$
);

-- Delete it after it runs once
SELECT cron.unschedule('manual-sync-now');
```

## 🎯 Benefits

### ✅ Self-Healing
- Automatically catches webhook failures
- Recovers from missed Stripe events
- Ensures database is always in sync

### ✅ Audit Trail
- `last_subscription_check` timestamp on every store
- Detailed logs in edge function
- Cron job history in `cron.job_run_details`

### ✅ Graceful Degradation
- If Stripe API is down, existing statuses remain
- Failed stores are logged but don't block others
- Next day's sync will retry

### ✅ Cost Efficient
- Only runs once daily
- Minimal Stripe API calls
- Uses Supabase's free pg_cron

## 🚨 Troubleshooting

### Cron not running?

```sql
-- Check if cron job exists
SELECT * FROM cron.job WHERE jobname = 'daily-stripe-subscription-sync';

-- Check run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
```

### Edge function errors?

Check logs in Supabase Dashboard:
- Edge Functions → sync-stripe-subscriptions → Logs

Common issues:
- Missing secrets (STRIPE_SECRET_KEY, etc.)
- Wrong authorization header
- Stripe API rate limits

### Subscriptions not updating?

1. Check edge function logs for errors
2. Verify Stripe API keys are correct
3. Check `stores` table has correct `stripe_customer_id`
4. Manually trigger sync to test

## 🔐 Security Notes

- Edge function requires authorization
- `CRON_SECRET` prevents unauthorized calls
- Service role key is only in database/edge function
- All logs are internal to Supabase

## 📝 Next Steps

1. ✅ Set required secrets in Supabase
2. ✅ Configure pg_cron authorization
3. ✅ Test manual sync
4. ✅ Wait for first automatic run (3 AM UTC)
5. ✅ Monitor logs and results

## 🎉 Result

**Cart access is now fully enforced!**

- Active subscriptions → Cart works ✅
- Canceled/past_due → Cart disabled ❌
- Automatic daily verification ✅
- Self-healing from webhook failures ✅

