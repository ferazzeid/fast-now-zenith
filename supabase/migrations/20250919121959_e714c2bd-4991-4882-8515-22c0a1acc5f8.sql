-- Create user_journeys table for tracking 90-day weight loss journeys
CREATE TABLE public.user_journeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  journey_type TEXT NOT NULL DEFAULT '90_day',
  start_date DATE NOT NULL,
  current_weight_at_start NUMERIC NOT NULL,
  target_weight NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_journeys ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own journeys"
  ON public.user_journeys
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all journeys"
  ON public.user_journeys
  FOR SELECT
  USING (is_current_user_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_user_journeys_updated_at
  BEFORE UPDATE ON public.user_journeys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create journey_daily_progress table for tracking daily metrics
CREATE TABLE public.journey_daily_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID NOT NULL REFERENCES public.user_journeys(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL,
  daily_deficit INTEGER DEFAULT 0,
  fat_burned_grams NUMERIC DEFAULT 0,
  weight_on_day NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(journey_id, progress_date)
);

-- Enable RLS for daily progress
ALTER TABLE public.journey_daily_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for daily progress
CREATE POLICY "Users can manage their own journey progress"
  ON public.journey_daily_progress
  FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM public.user_journeys WHERE id = journey_id
  ));

CREATE POLICY "Admins can view all journey progress"
  ON public.journey_daily_progress
  FOR SELECT
  USING (is_current_user_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_journey_daily_progress_updated_at
  BEFORE UPDATE ON public.journey_daily_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();