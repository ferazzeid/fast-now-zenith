-- Create intermittent_fasting_sessions table for tracking IF sessions
CREATE TABLE public.intermittent_fasting_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  fasting_window_hours INTEGER NOT NULL DEFAULT 16,
  eating_window_hours INTEGER NOT NULL DEFAULT 8,
  fasting_start_time TIMESTAMP WITH TIME ZONE,
  fasting_end_time TIMESTAMP WITH TIME ZONE,
  eating_start_time TIMESTAMP WITH TIME ZONE,
  eating_end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.intermittent_fasting_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can manage their own IF sessions" 
ON public.intermittent_fasting_sessions 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all IF sessions" 
ON public.intermittent_fasting_sessions 
FOR SELECT 
USING (is_current_user_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_intermittent_fasting_sessions_updated_at
BEFORE UPDATE ON public.intermittent_fasting_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add the IF mode setting to shared_settings
INSERT INTO public.shared_settings (setting_key, setting_value) 
VALUES ('intermittent_fasting_enabled', 'false')
ON CONFLICT (setting_key) DO NOTHING;