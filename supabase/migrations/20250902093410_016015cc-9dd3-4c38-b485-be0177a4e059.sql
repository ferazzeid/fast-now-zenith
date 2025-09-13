-- Update existing personal motivators to include link_url from system motivators
-- Match by title or content similarity

UPDATE public.motivators 
SET link_url = system_motivators.link_url
FROM public.system_motivators 
WHERE motivators.link_url IS NULL 
  AND motivators.category = 'personal'
  AND (
    motivators.title = system_motivators.title 
    OR similarity(motivators.title, system_motivators.title) > 0.8
    OR similarity(motivators.content, system_motivators.content) > 0.8
  )
  AND system_motivators.link_url IS NOT NULL;