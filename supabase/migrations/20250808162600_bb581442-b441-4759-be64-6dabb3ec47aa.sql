-- Add enable_daily_reset column to profiles table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'enable_daily_reset') THEN
        ALTER TABLE public.profiles 
        ADD COLUMN enable_daily_reset boolean DEFAULT false;
    END IF;
END $$;

-- Set up cron job to run the daily template application every hour
SELECT cron.schedule(
  'apply-daily-templates-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://texnkijwcygodtywgedm.supabase.co/functions/v1/apply-daily-templates',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleG5raWp3Y3lnb2R0eXdnZWRtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzE4NDcwMCwiZXhwIjoyMDY4NzYwNzAwfQ.EkbCtanQ3PTnFBVfpevhUi2JdlGfD0j5Ebd47VlvSTI"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);