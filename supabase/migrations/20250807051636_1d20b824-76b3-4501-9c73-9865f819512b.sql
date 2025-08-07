-- Create daily food templates table
CREATE TABLE public.daily_food_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  calories NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  serving_size NUMERIC NOT NULL DEFAULT 100,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on daily food templates
ALTER TABLE public.daily_food_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for daily food templates
CREATE POLICY "Users can manage their own daily food templates" 
ON public.daily_food_templates 
FOR ALL 
USING (auth.uid() = user_id);

-- Add enable_daily_reset to profiles table
ALTER TABLE public.profiles 
ADD COLUMN enable_daily_reset BOOLEAN DEFAULT false;

-- Add source_date to food_entries for historical tracking
ALTER TABLE public.food_entries 
ADD COLUMN source_date DATE DEFAULT CURRENT_DATE;

-- Add trigger for automatic timestamp updates on daily_food_templates
CREATE TRIGGER update_daily_food_templates_updated_at
BEFORE UPDATE ON public.daily_food_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();