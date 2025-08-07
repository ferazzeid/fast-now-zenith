-- Add inspirational quotes settings to shared_settings
INSERT INTO shared_settings (setting_key, setting_value) 
VALUES 
  ('fasting_timer_quotes', '[
    {"text": "The groundwork for all happiness is good health.", "author": "Leigh Hunt"},
    {"text": "Your body can stand almost anything. It''s your mind you have to convince.", "author": "Unknown"},
    {"text": "Health is not about the weight you lose, but about the life you gain.", "author": "Unknown"},
    {"text": "Every moment is a fresh beginning.", "author": "T.S. Eliot"},
    {"text": "Progress, not perfection.", "author": "Unknown"}
  ]'),
  ('walking_timer_quotes', '[
    {"text": "A journey of a thousand miles begins with a single step.", "author": "Lao Tzu"},
    {"text": "Walking is the ultimate exercise for body and mind.", "author": "Unknown"},
    {"text": "Every step you take is a step toward a better you.", "author": "Unknown"},
    {"text": "The miracle isn''t that I finished. The miracle is that I had the courage to start.", "author": "John Bingham"},
    {"text": "Movement is medicine for creating change in a person''s physical, emotional, and mental states.", "author": "Carol Welch"}
  ]')
ON CONFLICT (setting_key) DO NOTHING;