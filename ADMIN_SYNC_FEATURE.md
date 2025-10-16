# Admin Sync Feature - Manual Sync for Selected Users

## Overview
Added the ability for the admin to manually sync orders for any selected user from the admin sales dashboard. Also updated the button design across both sales pages.

## Implementation Details

### 1. Admin Sync API Endpoint
**File:** `app/api/admin/sync/route.ts`

**Purpose:** Allow admin to trigger manual sync for any user

**Access Control:**
- Requires valid authentication token
- Checks `user.user_metadata.admin === true`
- Returns 403 Forbidden if not admin

**Request:**
```json
POST /api/admin/sync
{
  "userId": "uuid-of-target-user",
  "days_back": 7
}
```

**Process:**
1. Verifies admin authentication
2. Gets target user's store from database
3. Verifies store has Shopify API token configured
4. Calls Supabase Edge Function to sync orders for that specific store
5. Returns sync results with detailed breakdown

**Response:**
```json
{
  "success": true,
  "message": "Successfully synced orders from last 7 days for shop.myshopify.com",
  "results": {
    "storeResults": [{
      "store_domain": "shop.myshopify.com",
      "success": true,
      "orders_checked": 26,
      "protection_sales": 1,
      "new_sales_count": 0,
      "existing_sales_count": 1,
      "revenue": 260,
      "commission": 65
    }]
  }
}
```

### 2. Admin Sales Page Updates
**File:** `app/(dashboard)/adminsales/page.tsx`

**New Features:**
1. **Sync Now Button** - Appears when a user is selected
2. **Days Back Dropdown** - Choose sync period (1, 3, 7, 14, or 30 days)
3. **Sync Status Messages** - Shows detailed results including:
   - Total protection sales found
   - Orders checked
   - Revenue and commission
   - Breakdown of new vs existing sales
4. **Auto-reload** - Refreshes sales data if new sales are found

**User Experience:**
- Button only enabled when a user is selected
- Shows "Syncing..." state while processing
- Displays success/error messages for 10 seconds
- Prevents multiple simultaneous syncs

### 3. Button Design Update
**Applied to both pages:**
- **Regular Sales Page:** `app/(dashboard)/sales/page.tsx`
- **Admin Sales Page:** `app/(dashboard)/adminsales/page.tsx`

**New Button Style:**
```css
{
  padding: '12px 24px',
  fontSize: '14px',
  fontWeight: '600',
  border: '1px solid #fff',      /* White border */
  borderRadius: '8px',
  backgroundColor: '#000',        /* Black background */
  color: '#fff',                  /* White text */
  transition: 'all 0.2s'
}
```

**Changes:**
- ✅ White border (1px solid)
- ✅ Black background
- ✅ White text
- ✅ No icons (removed 🔄 emoji)
- ✅ Opacity change when disabled (0.5)
- ✅ Consistent design across both pages

## Usage

### For Regular Users (Sales Page)
1. Navigate to `/sales`
2. Select days to sync (1, 3, 7, 14, or 30)
3. Click "Sync Now" to sync their own orders
4. View results in the success message

### For Admin (Admin Sales Page)
1. Navigate to `/adminsales`
2. Select a user from the dropdown
3. Select days to sync (1, 3, 7, 14, or 30)
4. Click "Sync Now" to sync that user's orders
5. View results in the success message
6. Sales table automatically refreshes if new sales are found

## Security

✅ **Admin-Only Access:** Endpoint verifies admin status on every request
✅ **User Validation:** Checks that target user exists and has a valid store
✅ **API Token Check:** Verifies user has configured Shopify API token
✅ **Service Role Protection:** Uses Supabase service role to access any user's data securely
✅ **No Bypassing:** Regular users cannot sync other users' orders

## Error Handling

**Common Scenarios:**
1. **No user selected:** "❌ Please select a user first"
2. **User has no store:** "No store found for this user"
3. **No API token:** "This user has not configured their Shopify API token"
4. **Sync fails:** Displays Shopify API error or network error
5. **Not admin:** Returns 403 Forbidden

## Example Messages

**When all sales already exist:**
```
✅ Sync complete! Found 1 protection sale from 26 orders. 
Revenue: $2.60, Commission: $0.65
All sales already saved in database
```

**When there are new sales:**
```
✅ Sync complete! Found 3 protection sales from 50 orders. 
Revenue: $15.80, Commission: $3.95
2 sales already saved, 1 new sale added
```

**When user has no API token:**
```
❌ This user has not configured their Shopify API token
```

## Files Modified/Created

1. **New API Endpoint:**
   - `app/api/admin/sync/route.ts` (new)

2. **Frontend Updates:**
   - `app/(dashboard)/adminsales/page.tsx` (added sync functionality)
   - `app/(dashboard)/sales/page.tsx` (updated button design)

3. **Documentation:**
   - `ADMIN_SYNC_FEATURE.md` (this file)

## Testing

✅ Admin can sync orders for selected users
✅ Button design is consistent (white border, black bg, white text, no icon)
✅ Sync messages show accurate breakdown
✅ Auto-refresh works when new sales are found
✅ Error handling works for all edge cases
✅ Non-admin users cannot access the endpoint
✅ No linter errors

## Benefits

✅ **Admin Control** - Full visibility and control over user syncs
✅ **User Support** - Can help users troubleshoot sync issues
✅ **Accurate Reporting** - Shows complete sync breakdown
✅ **Consistent UI** - Same button design across all pages
✅ **Safe Operation** - Cannot create duplicate records
✅ **Clear Feedback** - Users know exactly what happened

