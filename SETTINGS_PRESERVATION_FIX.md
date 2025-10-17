# Settings Preservation Fix

## Problem
When users changed their Shopify store domain or API token, the `cart_active` setting would appear as "Active" in the UI but was actually set to `false` in the database, causing the cart to not open.

## Root Cause
1. User had previously disabled the cart (`cart_active = false`)
2. When changing the store domain via "Validate & Connect Store", the system would:
   - Update the store record with the new domain
   - Check if settings existed and preserve them (including `cart_active = false`)
3. The frontend didn't reload the `cart_active` value after validation
4. UI showed "Active" (possibly due to stale state or default value) while database had `false`

## Fixes Implemented

### 1. Backend: Explicit Settings Preservation (validate-token route)
**File**: `app/api/shopify/validate-token/route.ts`

**Changes**:
- Added explicit logging when settings are preserved: `console.log('✅ Existing settings preserved (cart_active:', existingSettings.cart_active, ')')`
- Return current settings in API response so frontend can sync its state:
```typescript
settings: {
  cart_active: existingSettings?.cart_active ?? true,
  enabled: existingSettings?.enabled ?? true
}
```

### 2. Backend: Settings Preservation (update route)
**File**: `app/api/user/store/update/route.ts`

**Changes**:
- Added console logging for clarity: `console.log('✅ Updated store info, settings preserved')`
- Fetch and return current settings after update:
```typescript
const { data: currentSettings } = await supabase
  .from('settings')
  .select('cart_active, enabled')
  .eq('store_id', storeId)
  .single();
```
- Return settings in API response for frontend to sync

### 3. Frontend: State Synchronization After Validation
**File**: `app/(dashboard)/settings/page.tsx` (handleValidateToken)

**Changes**:
- Update `cartActive` state from API response after validation:
```typescript
if (data.settings && data.settings.cart_active !== undefined) {
  console.log('📊 Updating cart_active from validation response:', data.settings.cart_active);
  setCartActive(data.settings.cart_active);
}
```
- Updated success message: "Store connected and validated successfully! Settings preserved."

### 4. Frontend: State Synchronization After Save
**File**: `app/(dashboard)/settings/page.tsx` (handleSaveSettings)

**Changes**:
- Update `cartActive` state from API response after saving:
```typescript
if (settings && settings.cart_active !== undefined) {
  console.log('📊 Updating cart_active from save response:', settings.cart_active);
  setCartActive(settings.cart_active);
}
```
- Updated success message: "Settings saved successfully! All preferences preserved."

### 5. Frontend: User Information Notice
**File**: `app/(dashboard)/settings/page.tsx`

**Changes**:
- Added informative notice in the Shopify Connection section:
```
ℹ️ Note: Changing your store domain or API token will preserve all your 
settings including cart activation status, design preferences, and add-on 
configurations.
```

## How It Works Now

### When User Changes Domain/Token:

1. **User enters new domain and API token**
2. **Clicks "Validate & Connect Store"**
3. **Backend validates token and updates store record**
4. **Backend checks existing settings and preserves them** (including `cart_active`)
5. **Backend returns current settings in response**
6. **Frontend receives response and updates `cartActive` state** from actual database value
7. **UI now shows correct cart status** (matches database)

### Result:
✅ All settings preserved when changing domain/token
✅ Frontend always syncs with database state
✅ No confusion between UI state and database state
✅ Clear user communication about settings preservation

## Testing Checklist

- [x] Change store domain → cart_active preserved
- [x] Change API token → cart_active preserved
- [x] UI shows correct cart status after changes
- [x] Console logs show settings being preserved
- [x] Success messages indicate settings preservation
- [x] User sees informative notice about preservation

## Database Constraints

The `stores` table has these unique constraints:
- `stores_user_id_unique` - Each user can only have ONE store
- `stores_shop_domain_key` - Each domain can only appear ONCE

When a user changes domains, the `upsert` operation with `onConflict: 'user_id'` updates the SAME store record (not create a new one), which is correct behavior.

## Migration Notes

No database migrations needed. This fix only updates:
- API routes to return current settings
- Frontend to sync state from API responses
- User-facing messaging for clarity

## Related Files

- `app/api/shopify/validate-token/route.ts` - Token validation and store update
- `app/api/user/store/update/route.ts` - Store info update
- `app/(dashboard)/settings/page.tsx` - Settings UI
- `supabase/migrations/add_cart_active.sql` - Cart active column (already exists)

## Security Notes

- Settings are only accessible to authenticated users
- Each user can only modify their own store settings
- Token-based authentication required for cart.js API calls
- Domain binding enforced for security

