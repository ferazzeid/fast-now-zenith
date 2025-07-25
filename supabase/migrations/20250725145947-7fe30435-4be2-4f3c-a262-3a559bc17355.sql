-- Extend profiles table with user physical data and goals
ALTER TABLE public.profiles 
ADD COLUMN weight DECIMAL(5,2), -- in kg
ADD COLUMN height INTEGER, -- in cm
ADD COLUMN age INTEGER,
ADD COLUMN daily_calorie_goal INTEGER,
ADD COLUMN daily_carb_goal INTEGER; -- in grams

-- Create walking sessions table
CREATE TABLE public.walking_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  calories_burned INTEGER,
  distance DECIMAL(8,2), -- in meters, optional
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on walking_sessions
ALTER TABLE public.walking_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for walking_sessions
CREATE POLICY "Users can manage their own walking sessions" 
ON public.walking_sessions 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all walking sessions" 
ON public.walking_sessions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create food entries table
CREATE TABLE public.food_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  calories DECIMAL(8,2) NOT NULL, -- per serving
  carbs DECIMAL(8,2) NOT NULL, -- per serving in grams
  serving_size DECIMAL(8,2) DEFAULT 100, -- in grams
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on food_entries
ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for food_entries
CREATE POLICY "Users can manage their own food entries" 
ON public.food_entries 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all food entries" 
ON public.food_entries 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create user foods library table
CREATE TABLE public.user_foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  calories_per_100g DECIMAL(8,2) NOT NULL,
  carbs_per_100g DECIMAL(8,2) NOT NULL,
  variations JSONB DEFAULT '[]'::jsonb, -- for different stores/brands
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_foods
ALTER TABLE public.user_foods ENABLE ROW LEVEL SECURITY;

-- Create policies for user_foods
CREATE POLICY "Users can manage their own food library" 
ON public.user_foods 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user foods" 
ON public.user_foods 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_walking_sessions_updated_at
BEFORE UPDATE ON public.walking_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_food_entries_updated_at
BEFORE UPDATE ON public.food_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_foods_updated_at
BEFORE UPDATE ON public.user_foods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();