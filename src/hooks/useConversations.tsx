import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioEnabled?: boolean;
}

export interface Conversation {
  id: string;
  title: string | null;
  messages: Message[];
  last_message_at: string;
  created_at: string;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load conversations from database
  const loadConversations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(conv => {
        let messages: Message[] = [];
        try {
          if (typeof conv.messages === 'string') {
            messages = JSON.parse(conv.messages);
          } else if (Array.isArray(conv.messages)) {
            messages = conv.messages as any[];
          }
        } catch (e) {
          console.error('Error parsing messages:', e);
        }
        
        return {
          ...conv,
          messages: messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        };
      });
      
      setConversations(transformedData);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create new conversation
  const createConversation = async (firstMessage: Message): Promise<string | null> => {
    if (!user) return null;

    try {
      const title = firstMessage.content.slice(0, 50) + (firstMessage.content.length > 50 ? '...' : '');
      
      // Serialize the message with timestamp as ISO string
      const messageForDb = {
        ...firstMessage,
        timestamp: firstMessage.timestamp.toISOString()
      };

      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          title,
          messages: JSON.stringify([messageForDb]),
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const newConversation = {
        ...data,
        messages: [firstMessage]
      } as Conversation;
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      
      return newConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
      return null;
    }
  };

  // Add message to conversation
  const addMessage = async (conversationId: string, message: Message) => {
    if (!user) return;

    try {
      // Get current conversation
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      const updatedMessages = [...conversation.messages, message];

      // Serialize messages with timestamps as ISO strings
      const messagesForDb = updatedMessages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }));

      const { error } = await supabase
        .from('chat_conversations')
        .update({
          messages: JSON.stringify(messagesForDb),
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) throw error;

      // Update local state
      setConversations(prev => 
        prev.map(c => 
          c.id === conversationId 
            ? { ...c, messages: updatedMessages, last_message_at: new Date().toISOString() }
            : c
        )
      );

      if (currentConversation?.id === conversationId) {
        setCurrentConversation(prev => 
          prev ? { ...prev, messages: updatedMessages } : null
        );
      }
    } catch (error) {
      console.error('Error adding message:', error);
      toast({
        title: "Error",
        description: "Failed to save message",
        variant: "destructive",
      });
    }
  };

  // Delete conversation
  const deleteConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
      }

      toast({
        title: "Success",
        description: "Conversation deleted",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };

  // Load conversations when user changes
  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setConversations([]);
      setCurrentConversation(null);
    }
  }, [user]);

  return {
    conversations,
    currentConversation,
    loading,
    setCurrentConversation,
    createConversation,
    addMessage,
    deleteConversation,
    loadConversations
  };
};