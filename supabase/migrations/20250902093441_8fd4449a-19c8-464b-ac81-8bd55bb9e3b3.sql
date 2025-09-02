-- Update existing personal motivators to include link_url from system motivators
-- Use exact title matches only

UPDATE public.motivators 
SET link_url = system_motivators.link_url
FROM public.system_motivators 
WHERE motivators.link_url IS NULL 
  AND motivators.category = 'personal'
  AND motivators.title = system_motivators.title
  AND system_motivators.link_url IS NOT NULL;