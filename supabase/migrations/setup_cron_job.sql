-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant permissions to use pg_net
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA net TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA net GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA net GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA net GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- Create daily order sync cron job
-- Runs every day at 2:00 AM UTC
SELECT cron.schedule(
  'daily-order-sync',           -- Job name
  '0 2 * * *',                  -- Cron expression: At 02:00 every day
  $$
  SELECT
    net.http_post(
      url:='https://ezzpivxxdxcdnmerrcbt.supabase.co/functions/v1/sync-orders',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body:=jsonb_build_object('days_back', 2)
    ) as request_id;
  $$
);

-- View scheduled cron jobs
SELECT * FROM cron.job;

-- To manually trigger the cron job for testing:
-- SELECT cron.run_job('daily-order-sync');

-- To unschedule the job (if needed):
-- SELECT cron.unschedule('daily-order-sync');

-- To reschedule with different timing (example: every 6 hours):
-- SELECT cron.schedule('daily-order-sync', '0 */6 * * *', $$ ... $$);

