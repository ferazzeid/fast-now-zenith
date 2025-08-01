-- Create table to track user favorites for default foods
CREATE TABLE public.default_food_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  default_food_id uuid NOT NULL REFERENCES public.default_foods(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, default_food_id)
);

-- Enable RLS on the default_food_favorites table
ALTER TABLE public.default_food_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for default_food_favorites
CREATE POLICY "Users can view their own default food favorites" 
ON public.default_food_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own default food favorites" 
ON public.default_food_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own default food favorites" 
ON public.default_food_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can view all default food favorites
CREATE POLICY "Admins can view all default food favorites" 
ON public.default_food_favorites 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));