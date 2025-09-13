-- Add excerpt field to system_motivators table
ALTER TABLE public.system_motivators 
ADD COLUMN excerpt TEXT;

-- Populate excerpts for existing system motivators with short, engaging summaries
UPDATE public.system_motivators 
SET excerpt = CASE 
  WHEN title = 'Autophagy Clean-Up' THEN 'Unlock your body''s natural cellular repair system. Experience the transformative power of autophagy as your cells clean house and regenerate for optimal health.'
  WHEN title = 'Mirror Wake-Up' THEN 'Transform your reflection and boost confidence. Create a powerful morning ritual that motivates you to see the changes you''re working toward every single day.'
  WHEN title = 'Event Countdown' THEN 'Get ready for your special moment. Whether it''s a wedding, reunion, or milestone celebration, make sure you feel absolutely amazing when the day arrives.'
  WHEN title = 'Fit New Clothes' THEN 'Step into a new wardrobe and new confidence. Feel the excitement of shopping for smaller sizes and discovering styles you never thought you could wear.'
  WHEN title = 'Fit Old Clothes' THEN 'Rediscover your favorite pieces from the past. Nothing beats the satisfaction of slipping into those jeans or that dress that made you feel incredible.'
  WHEN title = 'Fix Insulin Levels' THEN 'Take control of your metabolic health. Improve insulin sensitivity, stabilize blood sugar, and reduce your risk of diabetes through strategic fasting.'
  WHEN title = 'Fix Unexplained Symptoms' THEN 'Address mysterious health issues naturally. Many unexplained symptoms can improve through intermittent fasting and giving your digestive system a proper reset.'
  WHEN title = 'Impress Them All' THEN 'Show everyone your incredible transformation. Let your success speak for itself and inspire others while building the confidence you''ve always deserved.'
  WHEN title = 'Regain Self-Respect' THEN 'Rebuild your relationship with yourself. Take back control of your health, habits, and happiness through the empowering practice of intermittent fasting.'
  ELSE LEFT(content, 150) || '...'
END
WHERE excerpt IS NULL;