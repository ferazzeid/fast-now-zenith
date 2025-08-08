-- Run the import scripts to populate fasting hours data
-- This will be handled by the import utilities we created

-- First, let's ensure we have the proper table structure
ALTER TABLE fasting_hours ADD COLUMN IF NOT EXISTS stage TEXT;
ALTER TABLE fasting_hours ADD COLUMN IF NOT EXISTS metabolic_changes TEXT;
ALTER TABLE fasting_hours ADD COLUMN IF NOT EXISTS physiological_effects TEXT;
ALTER TABLE fasting_hours ADD COLUMN IF NOT EXISTS mental_emotional_state TEXT[];
ALTER TABLE fasting_hours ADD COLUMN IF NOT EXISTS benefits_challenges TEXT;
ALTER TABLE fasting_hours ADD COLUMN IF NOT EXISTS content_snippet TEXT;
ALTER TABLE fasting_hours ADD COLUMN IF NOT EXISTS content_rotation_data JSONB;