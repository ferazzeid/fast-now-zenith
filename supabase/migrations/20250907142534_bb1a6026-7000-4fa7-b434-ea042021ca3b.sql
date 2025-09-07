-- Fix the slug mismatch for Mirror Wake-Up content
-- Update the motivators table record to match the system_motivators slug
UPDATE motivators 
SET slug = 'mirror-wake-up'
WHERE slug = 'mirror-wake-up-196605';

-- Also update the content to ensure we have the full article
UPDATE motivators 
SET content = 'The mirror is easy to manipulate. You learn the good angles, you glance quickly, you convince yourself things aren''t that bad. But then comes the shock of seeing yourself from a distance — in a photo, a reflection you weren''t ready for, or in my case, a security camera. From that angle it feels like you''re watching a stranger in a video game or a movie, and the denial vanishes. The size, the way you move, the heaviness in your posture — it''s undeniable.

That moment was one of the strongest motivators I''ve ever felt. It wasn''t something I wanted to move toward, it was something I wanted to move away from. I didn''t want to be that image anymore. For weeks I would even avoid looking at those cameras because they put me in a bad mood. But later, after losing weight, the same cameras became a source of joy. I would catch myself walking by, slimmer, lighter, and think, who is that? At first it feels like a punishment, then it becomes a reward. The mirror and the camera stop being enemies and turn into allies that confirm you''ve changed.'
WHERE slug = 'mirror-wake-up';