-- Create default foods table that will be shared across all users
CREATE TABLE public.default_foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  calories_per_100g NUMERIC NOT NULL,
  carbs_per_100g NUMERIC NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.default_foods ENABLE ROW LEVEL SECURITY;

-- Create policies - all users can read default foods, only admins can manage them
CREATE POLICY "Anyone can view default foods" 
ON public.default_foods 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage default foods" 
ON public.default_foods 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_default_foods_updated_at
BEFORE UPDATE ON public.default_foods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the recommended default foods
INSERT INTO public.default_foods (name, calories_per_100g, carbs_per_100g) VALUES
('Brie Cheese', 334, 0.5),
('Camembert Cheese', 300, 0.5),
('Light Cheese', 279, 1),
('Cucumber', 15, 3.6),
('Greek Yogurt (unsweetened)', 60, 3.5),
('Salmon Steak', 208, 0),
('Smoked Salmon', 117, 0),
('Trout', 190, 0),
('Pickles (non-fermented)', 12, 2),
('Fermented Pickles', 11, 1.5),
('Plain Yogurt', 61, 4.7),
('Feta Cheese', 264, 4),
('Tomatoes', 18, 3.9),
('Egg', 143, 0.7),
('Chicken (grilled, skinless)', 165, 0),
('Sausage (average pork)', 300, 1.5),
('Minced Meat (beef)', 250, 0),
('Avocado', 160, 8.5);