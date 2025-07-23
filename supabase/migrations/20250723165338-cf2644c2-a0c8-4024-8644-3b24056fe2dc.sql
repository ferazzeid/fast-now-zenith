-- Add AI behavior configuration settings to shared_settings
INSERT INTO public.shared_settings (setting_key, setting_value) 
VALUES 
  ('ai_weak_moment_keywords', '["hungry", "craving", "struggling", "difficult", "hard", "tempted", "want to eat", "give up", "breaking", "cheat"]'),
  ('ai_motivator_suggestion_frequency', '3'),
  ('ai_coaching_encouragement_level', '7'),
  ('ai_auto_motivator_triggers', 'true'),
  ('ai_slideshow_transition_time', '15'),
  ('ai_admin_motivator_templates', '[]')
ON CONFLICT (setting_key) DO NOTHING;