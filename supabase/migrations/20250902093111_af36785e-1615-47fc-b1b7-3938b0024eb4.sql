-- Update existing motivators to include link_url from admin goal ideas
-- First, create a temporary function to help us match and update the records

UPDATE public.motivators 
SET link_url = admin_goal_ideas.link_url
FROM public.admin_goal_ideas 
WHERE motivators.link_url IS NULL 
  AND motivators.category = 'personal'
  AND (
    motivators.title = admin_goal_ideas.title 
    OR similarity(motivators.title, admin_goal_ideas.title) > 0.8
    OR similarity(motivators.content, admin_goal_ideas.description) > 0.8
  )
  AND admin_goal_ideas.link_url IS NOT NULL;