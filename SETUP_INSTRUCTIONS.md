# Setup Instructions

## 1. Add Environment Variables to Netlify

Go to: https://app.netlify.com/sites/blackcartapp/settings/environment

Add these variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ezzpivxxdxcdnmerrcbt.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6enBpdnh4ZHhjZG5tZXJyY2J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDcxNDYsImV4cCI6MjA3NTc4MzE0Nn0.yvvwDmap8NtqYONkBohgjpn_shKjP5uDP-rBETPFtG8

SUPABASE_SERVICE_ROLE_KEY=[Get from https://app.supabase.com/project/ezzpivxxdxcdnmerrcbt/settings/api]

NEXT_PUBLIC_APP_URL=https://blackcartapp.netlify.app
```

## 2. Deploy to Netlify

After adding environment variables, deploy the latest code.

## 3. Create Admin User

After deployment, visit this URL **once**:

```
https://blackcartapp.netlify.app/api/setup/create-user?secret=setup123
```

This will create your admin account:
- Email: mathcivilce@gmail.com
- Password: Df45gh67!

## 4. Login

Go to: https://blackcartapp.netlify.app/login

Enter your credentials and you're in!

## 5. Protected Routes

Once logged in, you can access:
- `/settings` - Configure protection settings
- `/` - Dashboard home

## 6. Logout

Add a logout button to any page:

```javascript
await fetch('/api/auth/logout', { method: 'POST' });
window.location.href = '/login';
```

## Security Notes

- The setup route (`/api/setup/create-user`) should be disabled after first use
- All routes except `/login`, `/cart.js`, and `/api/settings` require authentication
- Session cookies are httpOnly and secure in production

