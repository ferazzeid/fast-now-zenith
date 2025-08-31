-- Update all system goals with their respective URLs
UPDATE public.motivators 
SET link_url = '/motivators/' || slug 
WHERE is_system_goal = true AND link_url IS NULL;

-- Verify the update worked
SELECT title, gender, slug, link_url 
FROM public.motivators 
WHERE is_system_goal = true 
ORDER BY gender, title;