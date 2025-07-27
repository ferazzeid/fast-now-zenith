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
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        throw error;
      }
      
      if (data) {
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
        
        setMessages(transformedMessages);
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

    try {
      const updatedMessages = [...messages, message];
      
      // Serialize messages with timestamps as ISO strings
      const messagesForDb = updatedMessages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }));

      // Check if conversation exists
      const { data: existingConversation } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingConversation) {
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

      // Update local state
      setMessages(updatedMessages);
      return true;
    } catch (error) {
      console.error('Error adding message:', error);
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