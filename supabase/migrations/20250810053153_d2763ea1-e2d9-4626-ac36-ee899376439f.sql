-- Add default profile values and ensure correct calorie goals
UPDATE profiles 
SET 
  daily_calorie_goal = COALESCE(daily_calorie_goal, 1500),
  daily_carb_goal = COALESCE(daily_carb_goal, 30)
WHERE daily_calorie_goal IS NULL OR daily_carb_goal IS NULL;

-- Add a trigger to set default values for new profiles
CREATE OR REPLACE FUNCTION set_profile_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Set default calorie goal to 1500 if not provided
  IF NEW.daily_calorie_goal IS NULL THEN
    NEW.daily_calorie_goal := 1500;
  END IF;
  
  -- Set default carb goal to 30 if not provided
  IF NEW.daily_carb_goal IS NULL THEN
    NEW.daily_carb_goal := 30;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run before insert or update
DROP TRIGGER IF EXISTS trigger_set_profile_defaults ON profiles;
CREATE TRIGGER trigger_set_profile_defaults
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profile_defaults();