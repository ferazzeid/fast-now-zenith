-- Remove duplicate "Be Looked At" entries from motivators table
-- These are truncated duplicates that override the proper system_motivators entry

DELETE FROM public.motivators 
WHERE slug IN ('be-looked-at', 'be-looked-at-440186', 'be-looked-at-981380')
AND title = 'Be Looked At';