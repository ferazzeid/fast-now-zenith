-- Remove the problematic check constraint if it exists and update data properly
ALTER TABLE fasting_hours DROP CONSTRAINT IF EXISTS fasting_hours_phase_check;

-- Update content rotation data to include proper variants for all existing rows
UPDATE fasting_hours 
SET 
  content_rotation_data = jsonb_build_object(
    'current_index', 0,
    'variants', jsonb_build_array(
      jsonb_build_object('type', 'metabolic', 'content', COALESCE(metabolic_changes, 'Metabolic information coming soon')),
      jsonb_build_object('type', 'physiological', 'content', COALESCE(physiological_effects, body_state, 'Physical effects information coming soon')),
      jsonb_build_object('type', 'mental', 'content', CASE WHEN mental_emotional_state IS NOT NULL THEN array_to_string(mental_emotional_state, ', ') ELSE 'Mental state information coming soon' END),
      jsonb_build_object('type', 'benefits', 'content', COALESCE(benefits_challenges, 'Benefits and challenges information coming soon')),
      jsonb_build_object('type', 'snippet', 'content', COALESCE(content_snippet, CONCAT('Hour ', hour, ': Information coming soon')))
    )
  )
WHERE content_rotation_data IS NULL OR content_rotation_data->>'variants' = '[]';