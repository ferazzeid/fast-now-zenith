-- Fix content rotation data to properly include the comprehensive information
UPDATE fasting_hours 
SET 
  content_rotation_data = jsonb_build_object(
    'current_index', 0,
    'variants', jsonb_build_array(
      jsonb_build_object('type', 'metabolic', 'content', metabolic_changes),
      jsonb_build_object('type', 'physiological', 'content', physiological_effects),
      jsonb_build_object('type', 'mental', 'content', array_to_string(mental_emotional_state, '. ')),
      jsonb_build_object('type', 'benefits', 'content', benefits_challenges),
      jsonb_build_object('type', 'snippet', 'content', content_snippet)
    )
  ),
  encouragement = CASE 
    WHEN hour <= 12 THEN 'Great start! Your body is adapting beautifully.'
    WHEN hour <= 24 THEN 'Excellent progress! You''re entering the fat-burning zone.'
    WHEN hour <= 48 THEN 'Amazing milestone! Your metabolic flexibility is improving.'
    ELSE 'Incredible achievement! You''re experiencing deep cellular benefits.'
  END
WHERE hour BETWEEN 1 AND 72 
  AND metabolic_changes IS NOT NULL 
  AND physiological_effects IS NOT NULL;