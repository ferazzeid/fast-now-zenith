-- Create chat conversations table for persistent memory
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on chat_conversations
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Users can manage their own conversations
CREATE POLICY "Users can manage their own conversations" 
ON public.chat_conversations 
FOR ALL 
USING (auth.uid() = user_id);

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations" 
ON public.chat_conversations 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_chat_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_chat_conversations_user_last_message 
ON public.chat_conversations(user_id, last_message_at DESC);

-- Add image storage settings to shared_settings
INSERT INTO public.shared_settings (setting_key, setting_value) 
VALUES 
  ('free_user_image_limit', '10'),
  ('max_image_size_mb', '5'),
  ('image_compression_quality', '0.8')
ON CONFLICT (setting_key) DO NOTHING;