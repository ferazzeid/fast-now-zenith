-- Add conversation_type to chat_conversations table
ALTER TABLE public.chat_conversations 
ADD COLUMN conversation_type text DEFAULT 'general';

-- Add constraint to ensure valid conversation types
ALTER TABLE public.chat_conversations 
ADD CONSTRAINT valid_conversation_type 
CHECK (conversation_type IN ('general', 'crisis'));

-- Add index for better performance on conversation type queries
CREATE INDEX idx_chat_conversations_type_user 
ON public.chat_conversations(user_id, conversation_type, created_at DESC);