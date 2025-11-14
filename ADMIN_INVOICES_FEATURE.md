# Admin Invoices Featureee

## Overview
A new admin page has been created that allows administrators to view invoices for all users in the system. This is similar to the Admin Sales page but focused on invoice data.

## What Was Created

### 1. API Route: `/api/admin/invoices`
**File:** `app/api/admin/invoices/route.ts`

- **Purpose:** Fetch invoices for a specific user (admin only)
- **Endpoint:** `GET /api/admin/invoices?userId={userId}`
- **Authentication:** Requires admin privileges
- **Returns:**
  - List of invoices for the selected user
  - Summary statistics (total, paid, pending, failed, amounts)
  - Store information (domain, name, email)

### 2. Admin Invoices Page
**File:** `app/(dashboard)/admininvoices/page.tsx`

- **Route:** `/admininvoices`
- **Access:** Admin only (shows access denied for non-admins)
- **Features:**
  - User selection dropdown (shows all users with their email, shop name, and subscription status)
  - Invoice summary cards showing:
    - Total Invoices
    - Paid invoices count
    - Pending invoices count
    - Failed invoices count
    - Total amount
    - Amount paid
  - Invoices table displaying:
    - Week (e.g., "Week 42, 2025")
    - Period (start and end dates)
    - Sales count
    - Commission amount
    - Status badge (color-coded: green for paid, orange for pending, red for failed)
    - Creation date
  - Information box explaining how weekly billing works

### 3. Updated Navigation
**File:** `app/(dashboard)/layout.tsx`

Added to the dashboard layout:
- **Invoices** menu item for all users (to view their own invoices)
- **Admin** expandable section (only visible to admins) containing:
  - Admin Sales
  - Admin Invoices

The admin section automatically detects admin status by checking the `/api/admin/users` endpoint and only shows the menu if the user has admin privileges.

## How It Works

1. **Admin Access Check:**
   - When the page loads, it checks if the user has admin privileges
   - Non-admin users see an "Access Denied" message
   - Admin users can proceed to view the dashboard

2. **User Selection:**
   - Admins can select any user from the dropdown
   - Dropdown shows: `email - shop name (subscription status)`

3. **Invoice Display:**
   - Once a user is selected, their invoices are fetched and displayed
   - Summary cards show aggregated statistics
   - Table shows detailed invoice information
   - Empty state shown if user has no invoices

## Usage

### For Admins:
1. Navigate to the Admin section in the sidebar
2. Click on "Admin Invoices"
3. Select a user from the dropdown
4. View their invoice history and summary

### Testing:
- Ensure you have admin privileges set in Supabase
- Access the page at `/admininvoices`
- Select different users to view their invoices

## Technical Details

- **State Management:** Uses React hooks (useState, useEffect)
- **Error Handling:** Displays user-friendly error messages
- **Loading States:** Shows spinners during data fetching
- **Styling:** Consistent with existing admin pages (dark theme, modern UI)
- **Security:** 
  - Admin check on both frontend and backend
  - Uses service role key for data access (bypasses RLS)
  - Validates admin status before returning data

## Files Modified/Created

### Created:
- `app/api/admin/invoices/route.ts` - API endpoint for fetching user invoices
- `app/(dashboard)/admininvoices/page.tsx` - Admin invoices page component

### Modified:
- `app/(dashboard)/layout.tsx` - Added navigation items and admin section

## Dependencies

This feature depends on:
- `/api/admin/users` - For fetching user list
- Supabase `invoices` table - For invoice data
- Supabase `stores` table - For user/store relationships
- Admin user metadata flag in Supabase auth

## Future Enhancements

Possible improvements:
- Add filtering by date range
- Add search functionality for users
- Export invoices to CSV
- Bulk actions (retry failed invoices, etc.)
- Invoice details modal/view
- Payment history timeline

