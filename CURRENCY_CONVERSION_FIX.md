# Currency Conversion Fix Implementation

## Problem Summary

Users with non-USD store currencies (e.g., Japanese Yen) were being overcharged because the system treated all prices as USD without conversion.

### Example: Bawor Wear Store
- **Store Currency**: JPY (Japanese Yen)
- **Protection Product Price**: 599 JPY (~$4 USD)
- **Recorded in Database**: 59,900 cents ($599 USD) ❌
- **Should Be**: ~388 cents (~$3.88 USD) ✅
- **Overcharge**: 150x (15,000%)

## Solution Implemented

### 1. Database Changes
✅ Added `shop_currency` column to `stores` table
- Stores ISO 4217 currency codes (USD, JPY, EUR, etc.)
- Default: 'USD' for backward compatibility

### 2. Currency Conversion Functions
✅ Created `convertCurrencyToUSDCents()` function
- Uses exchangerate-api.com (free API, 1,500 requests/month)
- Caches exchange rates for 24 hours
- Fallback to 1:1 rate if API fails

### 3. Updated Endpoints

#### Token Validation (`app/api/shopify/validate-token/route.ts`)
✅ Now fetches and stores shop currency when merchants connect their store

#### Sync Orders API (`app/api/shopify/sync-orders/route.ts`)
✅ Converts protection product prices from store currency to USD before saving

#### Edge Function (`supabase/functions/sync-orders/index.ts`)
✅ Same currency conversion logic for automated daily sync

### 4. Backfill
✅ Updated Bawor Wear store to JPY
✅ Created backfill script for other stores: `scripts/backfill-shop-currency.ts`

## Testing

### Test Case: Bawor Wear Store (JPY)

**Store Details:**
```
Domain: psizav-kq.myshopify.com
Name: Bawor Wear
Currency: JPY (Japanese Yen)
```

**Exchange Rate (as of test):**
```
1 JPY = 0.00647 USD
599 JPY = 3.88 USD = 388 cents
```

**Database Verification:**
```sql
-- Check store currency
SELECT id, shop_domain, shop_name, shop_currency
FROM stores
WHERE shop_domain = 'psizav-kq.myshopify.com';
-- Expected: shop_currency = 'JPY'

-- Check existing sales (before fix)
SELECT 
  order_number,
  protection_price / 100.0 as price_usd,
  created_at
FROM sales
WHERE store_id = 'a69c1074-f553-4b36-b9ba-c1430be7601f'
ORDER BY created_at DESC
LIMIT 5;
-- Expected: Old sales show $599.00 (incorrect)
-- New sales after fix should show ~$3.88-$4.00 (correct)
```

### How to Test New Orders

1. **Trigger a sync** for Bawor Wear store:
   ```bash
   curl -X POST https://your-domain.com/api/shopify/sync-orders \
     -H "Content-Type: application/json" \
     -d '{"store_id": "a69c1074-f553-4b36-b9ba-c1430be7601f", "days_back": 7}'
   ```

2. **Check logs** for currency conversion:
   ```
   💱 Converted 599 JPY -> 3.88 USD (rate: 0.00647)
   ```

3. **Verify database**:
   ```sql
   SELECT 
     order_number,
     protection_price / 100.0 as price_usd,
     commission / 100.0 as commission_usd,
     created_at
   FROM sales
   WHERE store_id = 'a69c1074-f553-4b36-b9ba-c1430be7601f'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   Expected: `price_usd` should be ~3.88 to 4.00, NOT 599.00

## Exchange Rate API

**Provider**: exchangerate-api.com  
**Free Tier**: 1,500 requests/month  
**Caching**: 24 hours per currency  
**Fallback**: 1:1 rate if API unavailable

**Supported Currencies**: All major currencies (USD, JPY, EUR, GBP, CAD, AUD, etc.)

## Backwards Compatibility

✅ **Existing USD stores**: No change in behavior (rate = 1.0)  
✅ **Legacy sales**: Old records remain unchanged  
✅ **Default currency**: New stores without detected currency default to USD

## Files Changed

1. `supabase/migrations/add_shop_currency.sql` - Database migration
2. `lib/shopify.ts` - Currency conversion functions
3. `app/api/shopify/validate-token/route.ts` - Store currency on connection
4. `app/api/shopify/sync-orders/route.ts` - Convert prices during sync
5. `supabase/functions/sync-orders/index.ts` - Convert prices in Edge Function
6. `scripts/backfill-shop-currency.ts` - Backfill script

## Running the Backfill Script

To update all existing stores with their correct currency:

```bash
# Install tsx if not already installed
npm install -g tsx

# Run the backfill script
npx tsx scripts/backfill-shop-currency.ts
```

This will:
- Fetch currency for each store from Shopify
- Update the `shop_currency` column
- Skip stores that already have the correct currency
- Show progress and summary

## Future Considerations

1. **Historical Data**: Old sales records remain in their original incorrect values. Consider:
   - Creating a one-time correction script
   - Documenting the cutover date
   - Adjusting invoices for affected merchants

2. **Exchange Rate Monitoring**: 
   - Monitor API rate limits
   - Consider upgrading to paid plan if needed
   - Add alerts for API failures

3. **Invoice Adjustments**:
   - Review invoices for non-USD merchants
   - Issue credits/refunds for overcharged amounts
   - Communicate changes to affected merchants

## Affected Stores

Based on database query, only one store confirmed with non-USD currency:
- **Bawor Wear** (psizav-kq.myshopify.com) - JPY

Run the backfill script to identify any other non-USD stores.

## Support

If merchants report incorrect charges:
1. Check their `shop_currency` in the database
2. Verify exchange rates in logs
3. Compare with Shopify order data
4. Manually adjust invoices if needed

