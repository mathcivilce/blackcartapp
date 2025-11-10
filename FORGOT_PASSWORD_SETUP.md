# Forgot Password - Setup Instructions

## ⚠️ IMPORTANT: Required Configuration

Before the forgot password feature will work, you **MUST** configure the Supabase redirect URLs.

## Step 1: Add Redirect URLs to Supabase

1. Go to your Supabase dashboard: 
   **https://supabase.com/dashboard/project/ezzpivxxdxcdnmerrcbt/auth/url-configuration**

2. Scroll to the **"Redirect URLs"** section

3. Add the following URLs (one per line):
   ```
   http://www.cartbase.app/auth/callback
   https://www.cartbase.app/auth/callback
   http://localhost:3000/auth/callback
   ```

4. Click **"Save"**

## Step 2: Verify Environment Variable

Make sure this environment variable is set in your deployment (Netlify):
```
NEXT_PUBLIC_SITE_URL=http://www.cartbase.app
```

Or if you're using HTTPS:
```
NEXT_PUBLIC_SITE_URL=https://www.cartbase.app
```

## Step 3: Deploy

Deploy your changes to Netlify. The feature will work once the redirect URLs are configured.

## How It Works

### The Flow:
1. **User** → Visits `/forgot-password` → Enters email
2. **System** → Sends email via Supabase with reset link
3. **Email Link** → `https://ezzpivxxdxcdnmerrcbt.supabase.co/auth/v1/verify?token=...&redirect_to=http://www.cartbase.app/auth/callback`
4. **Supabase** → Verifies the token → Redirects to your callback
5. **Callback** (`/auth/callback`) → Exchanges token for session → Sets cookies
6. **Redirect** → `/reset-password` → User sets new password
7. **Success** → User redirected to login with new password

### Why the Callback?

The callback route (`/auth/callback`) is necessary because:
- It securely exchanges the Supabase verification token for a session
- It sets HTTP-only cookies with the access and refresh tokens
- It ensures the user is properly authenticated when they reach the reset password page

### Security Features

- ✅ Uses Supabase's secure token verification
- ✅ Sets HTTP-only cookies (cannot be accessed by JavaScript)
- ✅ Validates token before allowing password reset
- ✅ Expired tokens are automatically rejected
- ✅ Email enumeration protection (always returns success)

## Testing

### Test Locally:
1. Run `npm run dev`
2. Go to `http://localhost:3000/login`
3. Click "Forgot password?"
4. Enter an email that exists in your Supabase Auth users
5. Check your email for the reset link
6. Click the link and verify you're redirected to reset password page

### Test Production:
1. Same steps as local, but use `http://www.cartbase.app/login`

## Troubleshooting

### Error: "Invalid redirect URL"
**Solution:** Make sure you added the callback URL to Supabase redirect URLs (Step 1)

### User is redirected to root instead of reset password page
**Solution:** Check that `NEXT_PUBLIC_SITE_URL` environment variable is set correctly

### "Invalid or expired reset link" error
**Solution:** 
- Reset links expire after 1 hour
- Request a new password reset
- Make sure the link hasn't been used already

### Email not received
**Solution:**
- Check spam folder
- Verify the email exists in Supabase Auth
- Check Supabase Auth logs for errors

## Need Help?

If you're still having issues:
1. Check the browser console for errors
2. Check Netlify function logs
3. Check Supabase Auth logs: https://supabase.com/dashboard/project/ezzpivxxdxcdnmerrcbt/auth/users

