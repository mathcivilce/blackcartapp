# ✅ Supabase Edge Function Deployed!

## 🎉 Deployment Status: COMPLETE

The `sync-orders` edge function has been successfully deployed to project `ezzpivxxdxcdnmerrcbt`.

**Function Details:**
- **Name:** sync-orders
- **Status:** ACTIVE ✅
- **Version:** 1
- **URL:** https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/sync-orders

---

## 🔧 Next Steps

### 1. Set Environment Variables (REQUIRED)

Go to **Supabase Dashboard** → **Edge Functions** → **sync-orders** → **Settings**

Add these environment variables:

```bash
SUPABASE_URL=https://ezzpivxxdxcdnmerrcbt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**To get your Service Role Key:**
1. Go to Supabase Dashboard
2. Settings → API
3. Copy the `service_role` secret key (starts with `eyJ...`)

---

### 2. Set Up Cron Job

Run this SQL in **Supabase SQL Editor**:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;

-- Create cron job (runs daily at 2 AM UTC)
SELECT cron.schedule(
  'daily-order-sync',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/sync-orders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY_HERE"}'::jsonb,
      body:='{"days_back": 2}'::jsonb
    ) as request_id;
  $$
);
```

**Important:** Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual service role key!

---

### 3. Verify Cron Job

```sql
-- Check if cron job was created
SELECT * FROM cron.job WHERE jobname = 'daily-order-sync';

-- Should show:
-- jobid | schedule  | command           | nodename  | jobname
-- ------|-----------|-------------------|-----------|------------------
-- 1     | 0 2 * * * | SELECT net.ht...  | localhost | daily-order-sync
```

---

## 🧪 Testing

### Test the Edge Function Manually

```bash
curl -X POST \
  https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/sync-orders \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"days_back": 7}'
```

**To get your Anon Key:**
- Supabase Dashboard → Settings → API → `anon` `public` key

### Test Cron Job Manually

```sql
-- Trigger the cron job immediately (for testing)
SELECT cron.run_job('daily-order-sync');

-- Check HTTP response
SELECT * FROM net._http_response ORDER BY id DESC LIMIT 1;
```

---

## 📊 Monitoring

### View Edge Function Logs

1. Go to Supabase Dashboard
2. **Edge Functions** → `sync-orders`
3. Click **Logs** tab
4. You'll see all executions with console output

### View Cron Job History

```sql
-- View recent cron executions
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-order-sync')
ORDER BY start_time DESC
LIMIT 10;
```

### Check Sales Data

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
ORDER BY s.created_at DESC
LIMIT 20;
```

---

## 🔄 How It Works

```
1. Cron triggers at 2 AM UTC daily
   ↓
2. Calls edge function via HTTP POST
   ↓
3. Edge function:
   - Gets all active stores with API tokens
   - Fetches orders from Shopify (last 2 days)
   - Finds protection product sales
   - Checks for duplicates
   - Records new sales in database
   ↓
4. Returns detailed results
```

---

## 🎯 Expected Results

When the cron runs or you test manually, you should see:

```json
{
  "success": true,
  "message": "Order sync completed",
  "results": {
    "totalStores": 2,
    "successfulStores": 2,
    "failedStores": 0,
    "totalOrders": 47,
    "totalProtectionSales": 12,
    "totalRevenue": 5880,
    "totalCommission": 1470,
    "storeResults": [
      {
        "store_domain": "8cd001-2.myshopify.com",
        "success": true,
        "orders_checked": 23,
        "protection_sales": 8,
        "revenue": 3920,
        "commission": 980
      }
    ]
  }
}
```

---

## 🔧 Management Commands

### Update Function Code

If you make changes to `supabase/functions/sync-orders/index.ts`:

```bash
# Re-deploy using MCP (from this chat)
# Or use Supabase CLI:
supabase functions deploy sync-orders
```

### Change Cron Schedule

```sql
-- Unschedule existing
SELECT cron.unschedule('daily-order-sync');

-- Schedule with new timing (e.g., every 6 hours)
SELECT cron.schedule('daily-order-sync', '0 */6 * * *', $$ ... $$);
```

### Pause Cron Job

```sql
-- Temporarily disable
SELECT cron.unschedule('daily-order-sync');

-- Re-enable
SELECT cron.schedule('daily-order-sync', '0 2 * * *', $$ ... $$);
```

---

## 🌐 Integration with Next.js Dashboard

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
      store_id: store.id,  // Sync only this user's store
      days_back: daysBack 
    })
  }
);
```

---

## ✅ Deployment Checklist

- [x] Edge function deployed
- [ ] Set `SUPABASE_URL` environment variable
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` environment variable
- [ ] Enable `pg_cron` extension
- [ ] Enable `pg_net` extension
- [ ] Create cron job with service role key
- [ ] Test edge function manually
- [ ] Test cron job manually
- [ ] Verify sales are being recorded
- [ ] Monitor first automated run at 2 AM UTC
- [ ] Update Next.js manual sync to use edge function (optional)

---

## 🎉 Benefits vs External Cron

✅ **Everything in Supabase** - No external services
✅ **Free** - Included in all Supabase plans
✅ **Fast** - Edge function runs close to database
✅ **Simple** - Manage everything in one dashboard
✅ **Secure** - Built-in authentication
✅ **Reliable** - Automatic retries and monitoring

---

## 🆘 Troubleshooting

### Cron Not Running

```sql
-- Check if cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Check if job exists
SELECT * FROM cron.job;

-- Check for errors
SELECT * FROM cron.job_run_details ORDER BY start_time DESC;
```

### Edge Function Errors

1. Check **Logs** in Supabase Dashboard → Edge Functions
2. Look for console.error() messages
3. Verify environment variables are set
4. Test with curl to see exact error

### No Sales Being Recorded

1. Check if stores have valid `api_token`
2. Verify `subscription_status = 'active'`
3. Check `addon_product_id` matches Shopify product
4. Look at edge function logs for errors

---

**Status:** ✅ Edge function deployed and ready!

**Next:** Set environment variables and create the cron job using the SQL above.

Once done, your order sync will run automatically every day at 2 AM UTC! 🚀

