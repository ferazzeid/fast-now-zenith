-- Add chat behavior settings to shared_settings table
INSERT INTO public.shared_settings (setting_key, setting_value) VALUES 
('food_chat_strict_mode', 'true'),
('food_chat_redirect_message', 'I''m your food tracking assistant. I can help you log meals, analyze nutrition, and manage your food library. Let''s keep our conversation focused on food and nutrition topics!'),
('food_chat_allowed_topics', 'food,nutrition,meals,calories,carbs,diet,health,cooking,ingredients,recipes')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;