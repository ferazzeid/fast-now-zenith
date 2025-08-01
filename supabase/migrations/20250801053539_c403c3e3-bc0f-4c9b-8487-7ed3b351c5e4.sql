-- Fix the INSERT policy for daily_activity_overrides to include WITH CHECK clause
DROP POLICY "Users can create their own activity overrides" ON public.daily_activity_overrides;

CREATE POLICY "Users can create their own activity overrides" 
ON public.daily_activity_overrides 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);