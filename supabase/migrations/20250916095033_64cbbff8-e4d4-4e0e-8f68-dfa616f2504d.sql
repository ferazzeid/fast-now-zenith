-- Remove unused AI model columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS enable_food_image_generation,
DROP COLUMN IF EXISTS speech_model,
DROP COLUMN IF EXISTS transcription_model,
DROP COLUMN IF EXISTS tts_model;

-- Clean up any shared_settings entries for deleted models
DELETE FROM public.shared_settings 
WHERE setting_key IN (
  'default_speech_model',
  'default_transcription_model', 
  'default_tts_model',
  'enable_food_image_generation'
);