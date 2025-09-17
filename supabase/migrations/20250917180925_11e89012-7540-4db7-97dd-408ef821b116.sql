INSERT INTO ai_function_prompts (function_name, prompt_section, prompt_content)
VALUES (
  'analyze-food-voice',
  'motivator_title_prompt',
  'When processing motivator titles, ensure proper title formatting: remove trailing punctuation (periods, exclamation marks, question marks), capitalize the first letter, and keep titles concise and impactful. Titles should not end with periods as they are headings, not sentences.'
)
ON CONFLICT (function_name, prompt_section) 
DO UPDATE SET prompt_content = EXCLUDED.prompt_content;