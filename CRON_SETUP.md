# Cron Job Setup Guide - Daily Order Synchronization

## 🎯 Purpose

Automatically sync Shopify orders daily to track protection product sales and calculate revenue commissions.

---

## 🔐 Security Setup

### 1. Set Cron Secret Key

Add to your environment variables (`.env.local` or hosting platform):

```bash
CRON_SECRET_KEY=your-random-secret-key-here-min-32-chars
```

**Generate a secure key:**
```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))

# Or use online: https://randomkeygen.com/
```

---

## 📅 Recommended Schedule

**Daily at 2:00 AM UTC**
- Runs during low-traffic hours
- Covers previous day's orders
- 2-day overlap prevents missing orders

---

## 🚀 Setup Options

### Option 1: Vercel Cron (Recommended for Vercel Deployments)

**File:** `vercel.json` (create in project root)

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-sync",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Advantages:**
- ✅ Built-in, no external service needed
- ✅ Automatic authentication
- ✅ Free on Vercel Pro plan
- ✅ Logs in Vercel dashboard

**Deployment:**
```bash
vercel --prod
```

The cron will automatically be configured!

---

### Option 2: GitHub Actions

**File:** `.github/workflows/daily-sync.yml`

```yaml
name: Daily Order Sync

on:
  schedule:
    # Runs daily at 2:00 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  sync-orders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Daily Sync
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_KEY }}" \
            https://your-domain.com/api/cron/daily-sync
```

**Setup:**
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add secret: `CRON_SECRET_KEY` with your secret key
3. Update `your-domain.com` with your actual domain
4. Commit the workflow file
5. GitHub will run it automatically

**Advantages:**
- ✅ Free unlimited usage
- ✅ Reliable
- ✅ Can manually trigger
- ✅ Workflow logs

---

### Option 3: External Cron Service (cron-job.org)

**Steps:**

1. Go to https://cron-job.org/
2. Create free account
3. Create new cron job:
   - **Title:** XCart Daily Order Sync
   - **URL:** `https://your-domain.com/api/cron/daily-sync?key=YOUR_SECRET_KEY`
   - **Schedule:** Daily at 2:00 AM
   - **Method:** GET
   - **Timeout:** 60 seconds

**Advantages:**
- ✅ Easy setup
- ✅ No code changes needed
- ✅ Email notifications on failure
- ✅ Execution history

**Security Note:** Your secret key will be in the URL. Use HTTPS only!

---

### Option 4: EasyCron

**Steps:**

1. Go to https://www.easycron.com/
2. Sign up for free account (up to 100 jobs)
3. Create cron job:
   - **URL:** `https://your-domain.com/api/cron/daily-sync`
   - **Schedule:** `0 2 * * *` (cron expression)
   - **Custom Headers:** 
     - `Authorization: Bearer YOUR_SECRET_KEY`

**Advantages:**
- ✅ Simple interface
- ✅ Execution logs
- ✅ Email alerts
- ✅ More secure (secret in header, not URL)

---

## 🧪 Testing

### Manual Test (Development)

```bash
# Without auth (if CRON_SECRET_KEY not set)
curl http://localhost:3000/api/cron/daily-sync

# With auth
curl -H "Authorization: Bearer YOUR_SECRET_KEY" \
  http://localhost:3000/api/cron/daily-sync
```

### Manual Test (Production)

```bash
curl -H "Authorization: Bearer YOUR_SECRET_KEY" \
  https://your-domain.com/api/cron/daily-sync
```

### Expected Response:

```json
{
  "success": true,
  "message": "Daily order sync completed successfully",
  "duration_ms": 2543,
  "timestamp": "2024-01-15T02:00:00.000Z",
  "results": {
    "totalStores": 5,
    "successfulStores": 5,
    "failedStores": 0,
    "totalOrders": 127,
    "totalProtectionSales": 34,
    "totalRevenue": 16660,
    "totalCommission": 4165,
    "storeResults": [...]
  }
}
```

---

## 📊 What the Cron Does

```
1. Authenticates using CRON_SECRET_KEY
   ↓
2. Calls /api/shopify/sync-orders
   ↓
3. For each store with API token:
   - Fetches orders from last 2 days
   - Finds protection product sales
   - Checks for duplicates (skips existing)
   - Calculates commission (25%)
   - Saves to sales table
   ↓
4. Returns summary of all synced data
```

---

## 🗄️ Database Tables Used

### `sales` Table:
```sql
- id (uuid)
- store_id (uuid, references stores)
- order_id (text) -- Shopify order ID (for deduplication)
- order_number (text) -- Human-readable like "#1001"
- protection_price (integer) -- Price in cents
- commission (integer) -- 25% commission in cents
- month (text) -- "2024-01" format
- created_at (timestamptz) -- Order date from Shopify
```

### Deduplication:
- Checks if `order_id` + `store_id` already exists
- Skips if found (prevents double-charging)

---

## 🔍 Monitoring

### Check Recent Sales:

```bash
curl https://your-domain.com/api/shopify/sync-orders
```

Returns:
- Last 10 sales
- Monthly summary

### Database Query:

```sql
-- Check today's synced sales
SELECT 
  s.order_number,
  st.shop_domain,
  s.protection_price / 100.0 as price,
  s.commission / 100.0 as commission,
  s.created_at
FROM sales s
JOIN stores st ON s.store_id = st.id
WHERE s.created_at::date = CURRENT_DATE
ORDER BY s.created_at DESC;
```

---

## ⚠️ Troubleshooting

### Cron Not Running:

**Vercel:**
- Check Vercel Dashboard → Deployments → Cron Jobs
- Ensure `vercel.json` is deployed
- Check function logs

**GitHub Actions:**
- Go to Actions tab in GitHub
- Check workflow runs
- Look for errors in logs

**External Service:**
- Check service's execution history
- Verify URL is correct
- Ensure secret key matches

### No Sales Being Recorded:

1. **Check API token validity:**
   ```bash
   # Test in dashboard
   curl -X POST https://your-domain.com/api/shopify/validate-token \
     -H "Content-Type: application/json" \
     -d '{"shop_domain": "store.myshopify.com", "api_token": "shpat_..."}'
   ```

2. **Verify protection product identifier:**
   - Check `settings.addon_product_id`
   - Must match Shopify product handle, SKU, or title
   - Default: "shipping-protection"

3. **Check date range:**
   - Default: last 2 days
   - Older orders won't be synced
   - Run manual sync with more days:
     ```bash
     curl -X POST https://your-domain.com/api/shopify/sync-orders \
       -H "Content-Type: application/json" \
       -d '{"days_back": 30}'
     ```

---

## 💰 Revenue Tracking

### Monthly Commission Report:

```sql
SELECT 
  month,
  COUNT(*) as total_sales,
  SUM(protection_price) / 100.0 as total_revenue,
  SUM(commission) / 100.0 as total_commission
FROM sales
WHERE month = '2024-01'
GROUP BY month;
```

### Per-Store Report:

```sql
SELECT 
  st.shop_domain,
  st.shop_name,
  COUNT(s.id) as sales_count,
  SUM(s.commission) / 100.0 as commission_owed
FROM stores st
LEFT JOIN sales s ON st.id = s.store_id 
  AND s.month = '2024-01'
GROUP BY st.id, st.shop_domain, st.shop_name
ORDER BY commission_owed DESC;
```

---

## 🚀 Production Checklist

- [ ] `CRON_SECRET_KEY` environment variable set
- [ ] Cron service configured and tested
- [ ] Database has `sales` table
- [ ] All stores have valid `api_token`
- [ ] Protection product identifier configured
- [ ] Test manual sync works
- [ ] Monitor first automated run
- [ ] Set up failure alerts (email/Slack)

---

## 📈 Future Enhancements

1. **Retry Logic** - Retry failed stores
2. **Email Reports** - Daily summary emails
3. **Slack Integration** - Post sync results to Slack
4. **Webhook Alternative** - Real-time order tracking
5. **Invoice Generation** - Auto-generate monthly invoices

---

**Status:** ✅ Ready for Production

The cron system is complete and can be deployed immediately!

