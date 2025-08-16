-- Update female goal titles to remove "(Female)" suffix
UPDATE shared_settings 
SET setting_value = jsonb_set(
  setting_value,
  '{}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN elem->>'gender' = 'female' THEN
          jsonb_set(elem, '{title}', to_jsonb(replace(elem->>'title', ' (Female)', '')))
        ELSE elem
      END
    )
    FROM jsonb_array_elements(setting_value) AS elem
  )
)
WHERE setting_key = 'admin_goal_ideas';