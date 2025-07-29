import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioEnabled?: boolean;
  imageUrl?: string;
}

export const useSingleConversation = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load the single conversation from database (non-archived)
  const loadConversation = async () => {
    if (!user) return;
    
    console.log('DEBUG: Loading conversation for user:', user.id);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('DEBUG: Query result:', { data, error });

      if (error) {
        throw error;
      }
      
      if (data) {
        console.log('DEBUG: Found conversation with', data.messages ? 'messages' : 'no messages');
        // Transform the data to match our interface
        let conversationMessages: Message[] = [];
        try {
          if (typeof data.messages === 'string') {
            conversationMessages = JSON.parse(data.messages);
          } else if (Array.isArray(data.messages)) {
            conversationMessages = data.messages as any[];
          }
        } catch (e) {
          console.error('Error parsing messages:', e);
        }
        
        const transformedMessages = conversationMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        console.log('DEBUG: Loaded', transformedMessages.length, 'messages from database');
        setMessages(transformedMessages);
      } else {
        console.log('DEBUG: No conversation found, starting fresh');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add message to the conversation
  const addMessage = async (message: Message) => {
    if (!user) return false;

    console.log('DEBUG: addMessage called with:', message);

    try {
      // Update local state first for immediate display
      const updatedMessages = [...messages, message];
      setMessages(updatedMessages);
      
      // Serialize messages with timestamps as ISO strings
      const messagesForDb = updatedMessages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }));

      console.log('DEBUG: Saving to database, total messages:', messagesForDb.length);

      // Check if conversation exists - get the most recent one
      const { data: conversations, error: queryError } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('last_message_at', { ascending: false })
        .limit(1);

      console.log('DEBUG: Existing conversation query result:', { conversations, queryError });

      const existingConversation = conversations && conversations.length > 0 ? conversations[0] : null;

      if (existingConversation) {
        console.log('DEBUG: Updating existing conversation:', existingConversation.id);
        // Update existing conversation
        const { error } = await supabase
          .from('chat_conversations')
          .update({
            messages: JSON.stringify(messagesForDb),
            last_message_at: new Date().toISOString()
          })
          .eq('id', existingConversation.id);

        if (error) throw error;
      } else {
        console.log('DEBUG: Creating new conversation');
        // Create new conversation
        const title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
        
        const { error } = await supabase
          .from('chat_conversations')
          .insert({
            user_id: user.id,
            title,
            messages: JSON.stringify(messagesForDb),
            last_message_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      console.log('DEBUG: Message saved successfully, local state updated');
      return true;
    } catch (error) {
      console.error('Error adding message:', error);
      // If database save fails, still keep the local state for better UX
      toast({
        title: "Error",
        description: "Failed to save message",
        variant: "destructive",
      });
      return false;
    }
  };

  // Archive the current conversation
  const archiveConversation = async () => {
    if (!user) return;

    try {
      // Mark the conversation as archived
      const { error } = await supabase
        .from('chat_conversations')
        .update({ archived: true })
        .eq('user_id', user.id)
        .eq('archived', false);

      if (error) throw error;

      // Clear local state
      setMessages([]);
      
      toast({
        title: "Success",
        description: "Conversation archived and started fresh",
      });
    } catch (error) {
      console.error('Error archiving conversation:', error);
      toast({
        title: "Error",
        description: "Failed to archive conversation",
        variant: "destructive",
      });
    }
  };

  // Clear the conversation completely (delete)
  const clearConversation = async () => {
    if (!user) return;

    try {
      // Delete the conversation from database
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('user_id', user.id)
        .eq('archived', false);

      if (error) throw error;

      // Clear local state
      setMessages([]);
      
      toast({
        title: "Success",
        description: "Conversation cleared",
      });
    } catch (error) {
      console.error('Error clearing conversation:', error);
      toast({
        title: "Error",
        description: "Failed to clear conversation",
        variant: "destructive",
      });
    }
  };

  // Load conversation when user changes
  useEffect(() => {
    if (user) {
      loadConversation();
    } else {
      setMessages([]);
    }
  }, [user]);

  return {
    messages,
    loading,
    addMessage,
    archiveConversation,
    clearConversation,
    loadConversation
  };
};