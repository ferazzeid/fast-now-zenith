
-- 1) Deduplicate shared_settings rows for 'admin_goal_ideas' (keep the newest)
WITH ranked AS (
  SELECT
    ctid,
    setting_key,
    updated_at,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY setting_key
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
    ) AS rn
  FROM public.shared_settings
  WHERE setting_key = 'admin_goal_ideas'
)
DELETE FROM public.shared_settings s
USING ranked r
WHERE s.ctid = r.ctid
  AND r.setting_key = 'admin_goal_ideas'
  AND r.rn > 1;

-- 2) Add a UNIQUE constraint so we can reliably upsert by setting_key
ALTER TABLE public.shared_settings
  ADD CONSTRAINT shared_settings_setting_key_unique UNIQUE (setting_key);

-- 3) Keep updated_at maintained automatically via trigger
--    We already have the function public.update_shared_settings_updated_at();
--    Create/replace the trigger to call it on insert/update.
DROP TRIGGER IF EXISTS set_timestamp_shared_settings ON public.shared_settings;

CREATE TRIGGER set_timestamp_shared_settings
BEFORE INSERT OR UPDATE ON public.shared_settings
FOR EACH ROW EXECUTE FUNCTION public.update_shared_settings_updated_at();
