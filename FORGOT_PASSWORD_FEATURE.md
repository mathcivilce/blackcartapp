# Forgot Password Feature

## Overview
This document describes the forgot password functionality that has been added to the Cartbase application.

## Files Created

### 1. Forgot Password Page (`app/forgot-password/page.tsx`)
- Allows users to request a password reset link
- Validates email input
- Shows success message after requesting reset
- Styled consistently with the existing login page

### 2. Reset Password Page (`app/reset-password/page.tsx`)
- Allows users to set a new password after clicking the reset link
- Validates that passwords match
- Requires minimum 8 characters
- Shows success message and redirects to login

### 3. Auth Callback Route (`app/auth/callback/route.ts`)
- Handles the token verification from Supabase
- Exchanges the token hash for a session
- Sets secure HTTP-only cookies
- Redirects to the reset password page

### 4. API Route (`app/api/auth/forgot-password/route.ts`)
- Handles password reset email requests
- Uses Supabase Auth `resetPasswordForEmail` function
- Configures redirect to callback handler
- Returns success regardless of email existence (for security)

### 5. Updated Login Page (`app/login/page.tsx`)
- Added "Forgot password?" link next to the password field
- Uses Next.js Link component for proper navigation
- Styled to match the existing design

### 6. Updated Middleware (`middleware.ts`)
- Added `/forgot-password`, `/reset-password`, and `/auth/callback` to public routes
- Allows unauthenticated access to password reset flow

## How It Works

### User Flow:
1. User clicks "Forgot password?" on the login page
2. User enters their email on the forgot password page
3. User receives an email with a password reset link
4. User clicks the link → goes to Supabase for verification
5. Supabase redirects to `/auth/callback` → verifies token and sets session
6. User is redirected to `/reset-password` page
7. User enters and confirms their new password
8. User is redirected to login page and can sign in with the new password

## Configuration Required

### Environment Variables
Ensure these environment variables are set (they should already be configured):

```env
NEXT_PUBLIC_SUPABASE_URL=https://ezzpivxxdxcdnmerrcbt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
NEXT_PUBLIC_SITE_URL=http://www.cartbase.app
```

### Supabase Redirect URLs (IMPORTANT!)
You MUST add the callback URL to your Supabase project's allowed redirect URLs:

1. Go to: https://supabase.com/dashboard/project/ezzpivxxdxcdnmerrcbt/auth/url-configuration
2. In the "Redirect URLs" section, add these URLs:
   - `http://www.cartbase.app/auth/callback` (production)
   - `http://localhost:3000/auth/callback` (local development)
3. Click "Save"

**Without this configuration, password reset emails will not work properly!**

### Supabase Email Template (Optional)
You can customize the password reset email template in your Supabase dashboard:

1. Go to: https://supabase.com/dashboard/project/ezzpivxxdxcdnmerrcbt/auth/templates
2. Select "Reset Password" template
3. Customize the email content if desired

The default template should work fine and will include:
- A link to reset the password
- The link redirects through: `[your-site-url]/auth/callback` → `/reset-password`

## Testing

### Local Development:
1. Start your Next.js app: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Click "Forgot password?"
4. Enter a valid email address that exists in your system
5. Check your email for the password reset link (or check Mailpit if using Supabase CLI locally)
6. Click the link to reset your password
7. Enter a new password and confirm
8. Log in with your new password

### Production:
- Same flow as local development
- Emails will be sent via your configured SMTP server in Supabase

## Security Features

1. **Email Enumeration Protection**: The API always returns success, even if the email doesn't exist
2. **Secure Token Handling**: Uses Supabase's secure token hash system
3. **Password Validation**: Minimum 8 characters required
4. **Session Validation**: Reset password page validates the user has a valid session from the email link
5. **HTTPS Only in Production**: Cookies are marked secure in production

## Troubleshooting

### Email Not Received
- Check spam folder
- Verify SMTP configuration in Supabase
- Check Supabase Auth logs for errors

### Reset Link Expired
- Reset links expire after a set time (default is 1 hour)
- User needs to request a new reset link

### "Invalid or expired reset link" Error
- Link may have been used already
- Link may have expired
- Request a new password reset

## UI/UX Features

- Consistent dark theme matching the login page
- Clear error and success messages
- Loading states for better UX
- Responsive design
- Auto-redirect after successful password reset

## Next Steps

If you want to further customize:
1. Modify email templates in Supabase dashboard
2. Adjust password requirements in `app/reset-password/page.tsx`
3. Customize the success/error messages
4. Add additional validation rules

