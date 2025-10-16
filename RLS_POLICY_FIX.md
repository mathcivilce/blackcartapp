# RLS Policy Fix for Sales and Invoices

## Problem
User `massagecheers@gmail.com` reported that sales and invoices data would only show sometimes, requiring multiple page refreshes. The API would return:
- Sometimes: `sales: [{…}]` with data ✅
- Sometimes: `sales: []` empty array ❌

## Root Cause
The `sales` and `invoices` tables had RLS (Row Level Security) enabled but **only had policies for service role access**, not for authenticated users. This caused inconsistent behavior in serverless environments where the service role client connection might not always be properly initialized.

### Original Policies (Incomplete)
```sql
-- Only service role access
CREATE POLICY "Service role has full access to sales" ON sales
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to invoices" ON invoices
  FOR ALL USING (auth.role() = 'service_role');
```

## Solution

### 1. Added User-Level RLS Policies
Created migration: `supabase/migrations/add_sales_invoices_user_policies.sql`

```sql
-- Allow users to read their own sales
CREATE POLICY "Users can read sales for their store" ON sales
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Allow users to read their own invoices
CREATE POLICY "Users can read invoices for their store" ON invoices
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );
```

### 2. Updated API Routes to Use Authenticated Client
Changed from service role client to authenticated user client:

**Before:**
```typescript
const { data: sales } = await supabase  // service role
  .from('sales')
  .select('*')
  .eq('store_id', store.id);
```

**After:**
```typescript
const { data: sales } = await authClient  // authenticated user
  .from('sales')
  .select('*')
  .eq('store_id', store.id);
```

### Files Modified
- ✅ `app/api/user/sales/route.ts` - Now uses `authClient` for queries
- ✅ `app/api/invoices/route.ts` - Now uses `authClient` for queries
- ✅ Database migration applied via MCP tool

## Benefits
1. **Consistent Data Access** - No more intermittent empty results
2. **Better Security** - Users can only access their own data via RLS
3. **Serverless Friendly** - Authenticated client is created fresh per request
4. **Future Proof** - RLS policies work even if service role has issues

## Verified
- ✅ RLS policies created successfully
- ✅ Both sales and invoices tables have user SELECT policies
- ✅ Service role policies remain for admin operations
- ✅ No linting errors

## Testing
User should now see consistent results when accessing:
- `/sales` page - Should always show their sales data
- `/invoices` page - Should always show their invoices

No more need to refresh multiple times!

