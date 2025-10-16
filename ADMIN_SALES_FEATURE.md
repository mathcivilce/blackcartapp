# Admin Sales Dashboard Feature

## Overview
Created an admin-only sales dashboard that allows the administrator (mathcivilce@gmail.com) to view sales data and orders for all users in the system.

## Implementation Details

### 1. Database Changes
**Migration:** `add_admin_column`

- Added `admin` flag to user metadata in `auth.users` table
- Set `admin = true` for mathcivilce@gmail.com
- Set `admin = false` for all other users
- Created helper function `is_admin(user_id)` for easy admin checks

**SQL Changes:**
```sql
-- Update admin user metadata
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{admin}', 
  'true'::jsonb
)
WHERE email = 'mathcivilce@gmail.com';

-- Set admin to false for all other users
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{admin}', 
  'false'::jsonb
)
WHERE email != 'mathcivilce@gmail.com';

-- Helper function
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT (raw_user_meta_data->>'admin')::boolean
    FROM auth.users
    WHERE id = user_id
  );
END;
$$;
```

### 2. API Endpoints

#### GET `/api/admin/users`
**Purpose:** Fetch all users with their store information (Admin only)

**Access Control:**
- Requires valid authentication token
- Checks `user.user_metadata.admin === true`
- Returns 403 Forbidden if not admin

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "userId": "uuid",
      "email": "user@example.com",
      "shopDomain": "shop.myshopify.com",
      "shopName": "Shop Name",
      "subscriptionStatus": "active",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET `/api/admin/sales?userId={userId}`
**Purpose:** Fetch sales data for a specific user (Admin only)

**Access Control:**
- Requires valid authentication token
- Checks `user.user_metadata.admin === true`
- Returns 403 Forbidden if not admin

**Query Parameters:**
- `userId` (required): The UUID of the user whose sales to fetch

**Response:**
```json
{
  "success": true,
  "sales": [
    {
      "id": "uuid",
      "order_number": "1234",
      "protection_price": 490,
      "commission": 122,
      "created_at": "2024-01-01T00:00:00Z",
      "month": "2024-01"
    }
  ],
  "summary": {
    "totalSales": 10,
    "totalRevenue": 4900,
    "totalCommission": 1220
  },
  "store": {
    "domain": "shop.myshopify.com",
    "name": "Shop Name",
    "email": "user@example.com"
  }
}
```

### 3. Admin Sales Page

**Location:** `app/(dashboard)/adminsales/page.tsx`

**Features:**
1. **Access Control**
   - Only accessible by users with `admin = true`
   - Shows "Access Denied" error for non-admin users
   - Automatically checks admin status on page load

2. **User Selection**
   - Dropdown menu listing all users with their:
     - Email address
     - Shop name or domain
     - Subscription status
   - Loads users on page mount
   - Fetches sales when a user is selected

3. **Sales Dashboard**
   - Summary cards showing:
     - Total Sales count
     - Total Revenue
     - User Commission (75%)
     - Platform Fee (25%)
   - Sales history table with:
     - Order number
     - Date
     - Protection price
     - User share (75%)
     - Platform fee (25%)

4. **UI/UX**
   - Loading states for users and sales data
   - Error handling with clear messages
   - Empty state when no sales exist
   - Modern dark theme matching app design

## Security Considerations

1. **Admin Flag Storage:** Admin status is stored in `raw_user_meta_data` which is secure and only modifiable through direct database access or service role.

2. **Double-Layer Protection:**
   - Frontend checks admin status to show/hide UI
   - Backend APIs verify admin status on every request
   - Non-admin users receive 403 Forbidden responses

3. **Service Role Usage:** Admin endpoints use the Supabase service role key to bypass RLS policies and access all user data.

4. **Authentication Required:** All endpoints require valid session tokens.

## How to Access

1. **Login as Admin:**
   - Email: mathcivilce@gmail.com
   - Use your existing password

2. **Navigate to Admin Dashboard:**
   - Go to `/adminsales` or navigate via the dashboard menu

3. **View User Sales:**
   - Select a user from the dropdown
   - View their sales data, revenue, and orders

## Testing Verification

✅ Database migration applied successfully
✅ Admin flag set correctly for mathcivilce@gmail.com (admin = true)
✅ Admin flag set correctly for other users (admin = false)
✅ API endpoints created with proper access control
✅ Admin sales page created with user selection
✅ No linter errors in any files

## Files Modified/Created

1. **Database Migration:**
   - Created migration: `add_admin_column`

2. **API Endpoints:**
   - `app/api/admin/users/route.ts` (new)
   - `app/api/admin/sales/route.ts` (new)

3. **Frontend Page:**
   - `app/(dashboard)/adminsales/page.tsx` (modified from sales/page.tsx)

4. **Documentation:**
   - `ADMIN_SALES_FEATURE.md` (this file)

## Future Enhancements (Optional)

1. Add pagination for large sales lists
2. Add date range filters
3. Export sales data to CSV
4. Add search functionality for users
5. Show more detailed analytics (charts, graphs)
6. Add ability to manage user subscriptions
7. Add audit logging for admin actions

