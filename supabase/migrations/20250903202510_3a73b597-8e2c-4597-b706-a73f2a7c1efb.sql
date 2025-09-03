-- Fix system_motivators link_url fields to use full fastnow.app URLs
UPDATE system_motivators 
SET link_url = CASE 
  WHEN link_url IS NOT NULL AND link_url != '' 
    AND NOT link_url LIKE 'http%' 
  THEN 'https://fastnow.app' || link_url
  ELSE link_url 
END
WHERE link_url IS NOT NULL 
  AND link_url != '' 
  AND NOT link_url LIKE 'http%';