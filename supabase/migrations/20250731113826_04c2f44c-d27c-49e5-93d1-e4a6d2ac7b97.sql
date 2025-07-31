-- Create table for daily activity level overrides
CREATE TABLE public.daily_activity_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  activity_level text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.daily_activity_overrides ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own activity overrides" 
ON public.daily_activity_overrides 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activity overrides" 
ON public.daily_activity_overrides 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity overrides" 
ON public.daily_activity_overrides 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity overrides" 
ON public.daily_activity_overrides 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_activity_overrides_updated_at
BEFORE UPDATE ON public.daily_activity_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();