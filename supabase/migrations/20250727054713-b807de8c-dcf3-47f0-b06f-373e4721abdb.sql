-- Add archived field to chat_conversations table
ALTER TABLE public.chat_conversations 
ADD COLUMN archived boolean NOT NULL DEFAULT false;

-- Create index for better performance when filtering archived conversations
CREATE INDEX idx_chat_conversations_archived ON public.chat_conversations(user_id, archived);