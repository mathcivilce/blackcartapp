# Environment Variables Setup

## Supabase Configuration

Get your credentials from: https://app.supabase.com/project/ezzpivxxdxcdnmerrcbt/settings/api

Create a `.env.local` file in the root directory with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ezzpivxxdxcdnmerrcbt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App
NEXT_PUBLIC_APP_URL=https://blackcartapp.netlify.app
```

## Steps to Set Up:

1. **Get Supabase Keys**:
   - Go to: https://app.supabase.com/project/ezzpivxxdxcdnmerrcbt/settings/api
   - Copy the "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the "anon/public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy the "service_role" key → `SUPABASE_SERVICE_ROLE_KEY`

2. **Create Database Tables**:
   - Go to: https://app.supabase.com/project/ezzpivxxdxcdnmerrcbt/editor
   - Run the SQL in `supabase/schema.sql`

3. **Add to Netlify**:
   - Go to: https://app.netlify.com/sites/blackcartapp/settings/deploys#environment
   - Add all three Supabase variables
   - Add `NEXT_PUBLIC_APP_URL=https://blackcartapp.netlify.app`

4. **Test Locally**:
   ```bash
   npm run dev
   ```

