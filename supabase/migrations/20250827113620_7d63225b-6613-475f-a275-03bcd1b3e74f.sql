-- Create user conversation context table for persistent cross-session data
CREATE TABLE public.user_conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_units TEXT DEFAULT 'metric',
  common_foods JSONB DEFAULT '[]'::jsonb,
  typical_serving_sizes JSONB DEFAULT '{}'::jsonb,
  frequent_clarifications TEXT[] DEFAULT '{}',
  conversation_patterns JSONB DEFAULT '{}'::jsonb,
  food_preferences JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create conversation summaries table for long-term context
CREATE TABLE public.conversation_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_type TEXT NOT NULL, -- 'daily', 'weekly', 'food_patterns', 'preferences'
  summary_data JSONB NOT NULL,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  relevance_score INTEGER DEFAULT 100, -- For prioritizing which summaries to load
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.user_conversation_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_summaries ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_conversation_context
CREATE POLICY "Users can manage their own conversation context"
ON public.user_conversation_context
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversation context"
ON public.user_conversation_context
FOR SELECT
USING (is_current_user_admin());

-- RLS policies for conversation_summaries
CREATE POLICY "Users can manage their own conversation summaries"
ON public.conversation_summaries
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversation summaries"
ON public.conversation_summaries
FOR SELECT
USING (is_current_user_admin());

-- Create indexes for performance
CREATE INDEX idx_user_conversation_context_user_id ON public.user_conversation_context(user_id);
CREATE INDEX idx_conversation_summaries_user_id ON public.conversation_summaries(user_id);
CREATE INDEX idx_conversation_summaries_type_date ON public.conversation_summaries(user_id, summary_type, date_range_start DESC);

-- Create trigger to update last_updated timestamp
CREATE OR REPLACE FUNCTION public.update_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_context_timestamp
  BEFORE UPDATE ON public.user_conversation_context
  FOR EACH ROW EXECUTE FUNCTION public.update_context_timestamp();