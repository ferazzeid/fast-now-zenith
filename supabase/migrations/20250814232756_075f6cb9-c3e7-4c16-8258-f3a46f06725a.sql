-- Add author tooltip settings to shared_settings table (no table creation needed as it exists)
-- Just ensure we can store author profile data
INSERT INTO shared_settings (setting_key, setting_value) 
VALUES 
  ('author_tooltip_image', '/lovable-uploads/default-author.png'),
  ('author_tooltip_name', 'Admin'),
  ('author_tooltip_title', 'Personal Insight')
ON CONFLICT (setting_key) DO NOTHING;