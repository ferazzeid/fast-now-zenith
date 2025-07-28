-- Create table for manual calorie burns
CREATE TABLE public.manual_calorie_burns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_name TEXT NOT NULL,
  calories_burned INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.manual_calorie_burns ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own manual calorie burns" 
ON public.manual_calorie_burns 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own manual calorie burns" 
ON public.manual_calorie_burns 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own manual calorie burns" 
ON public.manual_calorie_burns 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own manual calorie burns" 
ON public.manual_calorie_burns 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can view all manual calorie burns
CREATE POLICY "Admins can view all manual calorie burns" 
ON public.manual_calorie_burns 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_manual_calorie_burns_updated_at
BEFORE UPDATE ON public.manual_calorie_burns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();