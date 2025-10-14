# Supabase Edge Function & Cron Setup Guide

## 🎯 Overview

This guide shows how to deploy the order sync system using Supabase Edge Functions and Cron Jobs.

**Advantages:**
- ✅ Everything in Supabase (database, functions, cron)
- ✅ Built-in and free
- ✅ Better performance (edge function close to database)
- ✅ Easier management (single dashboard)
- ✅ No external services needed

---

## 📋 Prerequisites

1. **Supabase Account**
   - Project ID: `ezzpivxxdxcdnmerrcbt`
   - Access to Supabase Dashboard

2. **Supabase CLI Installed**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Verify installation
   supabase --version
   ```

3. **Login to Supabase**
   ```bash
   supabase login
   ```

---

## 🚀 Deployment Steps

### Step 1: Link Your Local Project to Supabase

```bash
# In your project root (C:\Users\mathc\Desktop\XCart)
supabase link --project-ref ezzpivxxdxcdnmerrcbt
```

You'll be prompted for your database password.

---

### Step 2: Deploy the Edge Function

```bash
# Deploy the sync-orders edge function
supabase functions deploy sync-orders

# Set environment variables for the function
supabase secrets set SUPABASE_URL=https://ezzpivxxdxcdnmerrcbt.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**To get your service role key:**
1. Go to Supabase Dashboard
2. Settings → API
3. Copy the `service_role` key (starts with `eyJ...`)

---

### Step 3: Test the Edge Function

```bash
# Test the function manually
curl -X POST \
  https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/sync-orders \
  -H "Authorization: Bearer YOUR_ANON_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"days_back": 7}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order sync completed",
  "results": {
    "totalStores": 2,
    "successfulStores": 2,
    "totalProtectionSales": 15,
    "totalRevenue": 7350,
    "totalCommission": 1837
  }
}
```

---

### Step 4: Enable Required Extensions

Run in **Supabase SQL Editor**:

```sql
-- Enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
```

---

### Step 5: Set Up Cron Job

**Option A: Using Configuration Parameter (Recommended)**

1. **Run this in SQL Editor** (replace with your actual key):
```sql
-- Set service role key permanently
ALTER DATABASE postgres 
SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY_HERE';
```

2. **Create the cron job:**
```sql
SELECT cron.schedule(
  'daily-order-sync',
  '0 2 * * *',  -- 2 AM UTC daily
  $$
  SELECT
    net.http_post(
      url:='https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/sync-orders',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body:=jsonb_build_object('days_back', 2)
    ) as request_id;
  $$
);
```

**Option B: Direct Key in Cron (Simpler but less secure)**

```sql
SELECT cron.schedule(
  'daily-order-sync',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/sync-orders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ACTUAL_SERVICE_ROLE_KEY"}'::jsonb,
      body:='{"days_back": 2}'::jsonb
    ) as request_id;
  $$
);
```

---

### Step 6: Verify Cron Job

```sql
-- View all scheduled cron jobs
SELECT * FROM cron.job;

-- Should show:
-- jobid | schedule    | command          | nodename  | jobname
-- ------+-------------+------------------+-----------+------------------
-- 1     | 0 2 * * *   | SELECT net.ht... | localhost | daily-order-sync
```

---

## 🧪 Testing

### Manual Trigger (for testing)

```sql
-- Run the cron job immediately
SELECT cron.run_job('daily-order-sync');

-- Check if HTTP request was sent
SELECT * FROM net._http_response ORDER BY id DESC LIMIT 1;
```

### Check Function Logs

1. Go to Supabase Dashboard
2. **Edge Functions** → `sync-orders`
3. Click **Logs** tab
4. You'll see all execution logs

---

## 📊 Monitoring

### View Recent Executions

```sql
-- View cron job run history
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-order-sync')
ORDER BY start_time DESC
LIMIT 10;
```

### Check Sales Records

```sql
-- View recent sales synced
SELECT 
  s.order_number,
  st.shop_domain,
  s.protection_price / 100.0 as price,
  s.commission / 100.0 as commission,
  s.created_at
FROM sales s
JOIN stores st ON s.store_id = st.id
WHERE s.created_at >= NOW() - INTERVAL '7 days'
ORDER BY s.created_at DESC;
```

---

## 🔧 Management Commands

### Update Cron Schedule

```sql
-- Change to run every 6 hours instead
SELECT cron.unschedule('daily-order-sync');
SELECT cron.schedule('daily-order-sync', '0 */6 * * *', $$ ... $$);
```

### Pause Cron Job

```sql
-- Unschedule (pause)
SELECT cron.unschedule('daily-order-sync');

-- Re-schedule (resume)
SELECT cron.schedule('daily-order-sync', '0 2 * * *', $$ ... $$);
```

### View Edge Function Metrics

Go to Supabase Dashboard:
- **Edge Functions** → `sync-orders`
- View invocations, errors, duration
- Download logs

---

## 🔄 Update Edge Function

When you make changes to the edge function code:

```bash
# Re-deploy
supabase functions deploy sync-orders

# Verify deployment
supabase functions list
```

The cron job will automatically use the new version!

---

## 🌐 Call from Next.js Dashboard

Update your manual sync to call the edge function:

```typescript
// app/api/shopify/manual-sync/route.ts
const response = await fetch(
  'https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/sync-orders',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      store_id: store.id,
      days_back: 7 
    })
  }
);
```

---

## 🔐 Security

### Service Role Key
- ✅ Only used server-side (edge function, cron)
- ✅ Never exposed to client
- ✅ Has full database access
- ✅ Required for cron to call edge function

### Anon Key
- ✅ Used for client-side calls
- ✅ Limited by RLS policies
- ✅ Safe to expose

---

## 📁 File Structure

```
XCart/
├── supabase/
│   ├── functions/
│   │   └── sync-orders/
│   │       └── index.ts              ✅ Edge function code
│   ├── migrations/
│   │   ├── setup_cron_job.sql        ✅ Cron job setup
│   │   └── set_service_role_key.sql  ✅ Key configuration
│   └── config.toml                   (auto-generated by CLI)
```

---

## ✅ Deployment Checklist

- [ ] Supabase CLI installed and logged in
- [ ] Project linked (`supabase link`)
- [ ] Edge function deployed (`supabase functions deploy`)
- [ ] Service role key set in secrets
- [ ] pg_cron extension enabled
- [ ] pg_net extension enabled
- [ ] Service role key configured in database
- [ ] Cron job scheduled
- [ ] Test manual trigger works
- [ ] Verify cron appears in `cron.job` table
- [ ] Check function logs in dashboard
- [ ] Monitor first automated run at 2 AM UTC

---

## 🆘 Troubleshooting

### Cron Not Running

```sql
-- Check if cron job exists
SELECT * FROM cron.job WHERE jobname = 'daily-order-sync';

-- Check execution history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC LIMIT 5;

-- Check for errors
SELECT * FROM net._http_response 
WHERE id IN (
  SELECT http_post FROM cron.job_run_details 
  WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-order-sync')
);
```

### Edge Function Errors

1. Check **Logs** in Supabase Dashboard → Edge Functions
2. Look for console.error() messages
3. Verify environment variables are set:
   ```bash
   supabase secrets list
   ```

### HTTP Request Fails

```sql
-- View HTTP response details
SELECT * FROM net._http_response 
ORDER BY id DESC LIMIT 1;

-- Should show status_code = 200
```

---

## 🎯 Advantages Summary

| Feature | Supabase Cron | External Cron |
|---------|---------------|---------------|
| **Cost** | Free | Depends on service |
| **Setup** | SQL command | Multiple steps |
| **Performance** | Fast (same network) | Slower (external) |
| **Monitoring** | Built-in dashboard | Separate service |
| **Reliability** | High | Depends on service |
| **Management** | Single place | Multiple places |

---

## 📞 Support

- **Supabase Docs:** https://supabase.com/docs/guides/functions
- **pg_cron Docs:** https://supabase.com/docs/guides/database/extensions/pg_cron
- **Edge Functions:** https://supabase.com/docs/guides/functions

---

**Status:** ✅ Ready to deploy!

Run the commands in order and you'll have a fully automated, Supabase-native order sync system! 🚀

