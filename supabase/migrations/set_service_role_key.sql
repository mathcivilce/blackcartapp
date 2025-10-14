-- Set the service role key as a configuration parameter
-- This allows the cron job to authenticate with edge functions
--
-- IMPORTANT: Replace 'YOUR_SERVICE_ROLE_KEY_HERE' with your actual service role key
-- You can find it in Supabase Dashboard → Settings → API → service_role key
--
-- This needs to be run ONCE by a superuser (postgres role)
-- Run this in the Supabase SQL Editor

-- Method 1: Set for current session (for testing)
-- SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY_HERE';

-- Method 2: Set permanently (recommended for production)
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY_HERE';

-- Verification query - should return your key
-- SELECT current_setting('app.settings.service_role_key', true);

-- Alternative: Use direct key in cron job (less secure but simpler)
-- Just replace the cron schedule with:
/*
SELECT cron.schedule(
  'daily-order-sync',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/sync-orders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ACTUAL_SERVICE_ROLE_KEY_HERE"}'::jsonb,
      body:='{"days_back": 2}'::jsonb
    ) as request_id;
  $$
);
*/

