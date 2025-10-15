# Netlify Deployment Setup

## ✅ Build Fixed!

Your Next.js app now builds successfully. The deployment should work on Netlify.

---

## 🔐 Required Environment Variables

You **MUST** set these environment variables in Netlify for the app to work in production:

### 1. Go to Netlify Dashboard

1. Open your site in Netlify
2. Go to **Site settings** → **Environment variables**
3. Add the following variables:

### 2. Add These Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ezzpivxxdxcdnmerrcbt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6enBpdnh4ZHhjZG5tZXJyY2J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDcxNDYsImV4cCI6MjA3NTc4MzE0Nn0.yvvwDmap8NtqYONkBohgjpn_shKjP5uDP-rBETPFtG8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6enBpdnh4ZHhjZG5tZXJyY2J0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDIwNzE0NiwiZXhwIjoyMDc1NzgzMTQ2fQ.KbKQ0SKyqXYFqylxtUPCr07DiyCdcvwat_YV9tjQoMg

# App URL (your Netlify URL)
NEXT_PUBLIC_APP_URL=https://www.cartbase.app
```

### 3. Get Your Anon Key

1. Go to **Supabase Dashboard**
2. **Settings** → **API**
3. Copy the **`anon` `public`** key
4. Paste it as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 📦 What Was Fixed

### 1. ✅ Added Missing Package

```json
"@supabase/auth-helpers-nextjs": "^0.10.0"
```

### 2. ✅ Fixed TypeScript Config

Excluded the `supabase` folder from build (Edge Functions are Deno, not Node.js):

```json
"exclude": ["node_modules", "supabase"]
```

### 3. ✅ Added Placeholder Environment Variables

Made the build work even without environment variables:

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';
```

### 4. ✅ Added Missing Button Style

Fixed the settings page TypeScript error.

---

## 🚀 Deploy to Netlify

### Option 1: Push to Git (Recommended)

```bash
git add .
git commit -m "Fix: Add missing package and build configuration"
git push origin main
```

Netlify will automatically rebuild.

### Option 2: Manual Deploy

If you don't use Git:

```bash
npm run build
```

Then drag the `.next` folder to Netlify.

---

## ✅ Verification

After deployment, check:

1. **Build logs** - Should show "✓ Compiled successfully"
2. **Environment variables** - All 4 should be set
3. **App loads** - Visit your Netlify URL
4. **Login works** - Test authentication
5. **Settings save** - Test the dashboard

---

## 🔧 Troubleshooting

### Build Still Fails

Make sure you committed these files:
- `package.json` (with new dependency)
- `tsconfig.json` (with exclude)
- `lib/supabase.ts` (with placeholders)
- `app/(dashboard)/settings/page.tsx` (with button style)

### App Works Locally But Not on Netlify

Check environment variables are set in **Netlify Dashboard** → **Site settings** → **Environment variables**

### "supabaseUrl is required" Error

You forgot to set `NEXT_PUBLIC_SUPABASE_URL` in Netlify environment variables.

---

## 📝 Files Changed

1. ✅ `package.json` - Added `@supabase/auth-helpers-nextjs`
2. ✅ `tsconfig.json` - Excluded `supabase` folder
3. ✅ `lib/supabase.ts` - Added placeholder values
4. ✅ `app/(dashboard)/settings/page.tsx` - Added button style

---

## 🎉 Next Steps

1. **Commit and push** these changes
2. **Set environment variables** in Netlify
3. **Wait for rebuild** (automatic)
4. **Test your app**
5. **Done!** 🚀

---

**Status:** ✅ Ready to deploy!

