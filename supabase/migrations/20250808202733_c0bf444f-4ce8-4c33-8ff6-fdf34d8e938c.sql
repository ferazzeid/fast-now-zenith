-- Clean up \n characters in the benefits_challenges field
UPDATE fasting_hours 
SET benefits_challenges = REPLACE(REPLACE(benefits_challenges, '\n', ' '), '\\n', ' ')
WHERE benefits_challenges LIKE '%\n%' OR benefits_challenges LIKE '%\\n%';

-- Also clean up any other fields that might have \n characters
UPDATE fasting_hours 
SET 
  metabolic_changes = REPLACE(REPLACE(metabolic_changes, '\n', ' '), '\\n', ' '),
  physiological_effects = REPLACE(REPLACE(physiological_effects, '\n', ' '), '\\n', ' '),
  content_snippet = REPLACE(REPLACE(content_snippet, '\n', ' '), '\\n', ' ')
WHERE 
  metabolic_changes LIKE '%\n%' OR metabolic_changes LIKE '%\\n%' OR
  physiological_effects LIKE '%\n%' OR physiological_effects LIKE '%\\n%' OR
  content_snippet LIKE '%\n%' OR content_snippet LIKE '%\\n%';