import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { conversationMemory } from '@/utils/conversationMemory';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioEnabled?: boolean;
  imageUrl?: string;
  conversationMemory?: string; // For storing memory context
}

export const useSingleConversation = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Enhanced conversation memory integration
  const loadConversationMemory = () => {
    const saved = localStorage.getItem(`conversation_memory_${user?.id}`);
    if (saved) {
      conversationMemory.import(saved);
    }
  };

  const saveConversationMemory = () => {
    if (user?.id) {
      localStorage.setItem(`conversation_memory_${user.id}`, conversationMemory.export());
    }
  };

  const loadConversation = async () => {
    if (!user) {
      console.log('DEBUG: No user, clearing messages');
      setMessages([]);
      return;
    }

    console.log('DEBUG: Loading conversation for user:', user.id);
    setLoading(true);

    try {
      // Initialize cross-session context for this user
      await conversationMemory.initializeWithUser(user.id);
      
      // Find the user's single non-archived conversation
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
        // Load conversation memory after loading messages
        loadConversationMemory();
      } else {
        console.log('DEBUG: No conversation found, starting fresh');
        // Add a greeting message for new conversations
        const greetingMessage: Message = {
          role: 'assistant',
          content: 'Hello! I\'m your AI assistant. I can help you track food, manage fasting sessions, start walking workouts, and answer questions about your health journey. What would you like to do today?',
          timestamp: new Date()
        };
        setMessages([greetingMessage]);
        // Reset conversation memory for new conversations
        conversationMemory.updateConversationState({ 
          currentTopic: 'general',
          isProcessingFood: false,
          awaitingClarification: false,
          sessionType: 'general'
        });
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
    setIsProcessingMessage(true);

    try {
      // Check if this is a food clarification before processing
      const foodClarification = conversationMemory.detectFoodClarification(message.content);
      if (foodClarification.isModification) {
        console.log('DEBUG: Detected food clarification:', foodClarification);
        // Add memory context to the message
        message.conversationMemory = await conversationMemory.getContextForAI();
        conversationMemory.updateConversationState({ 
          awaitingClarification: false,
          isProcessingFood: true 
        });
      }

      // Update local state first for immediate display
      const updatedMessages = [...messages, message];
      setMessages(updatedMessages);

      // Save conversation memory and cross-session learnings after adding message
      saveConversationMemory();
      await conversationMemory.saveCrossSessionLearnings();
      
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
    } finally {
      setIsProcessingMessage(false);
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
    console.log('DEBUG: useEffect triggered, user:', user?.id, 'current messages:', messages.length);
    if (user) {
      loadConversation();
    } else {
      console.log('DEBUG: No user, clearing messages');
      setMessages([]);
    }
  }, [user?.id]);

  // Enhanced methods for working with conversation memory
  const addFoodAction = (userMessage: string, foods: any[], type: 'add' | 'modify' | 'delete' = 'add') => {
    conversationMemory.addFoodAction(userMessage, foods, type);
    saveConversationMemory();
  };

  const updateConversationState = (updates: any) => {
    conversationMemory.updateConversationState(updates);
    saveConversationMemory();
  };

  const getConversationContext = () => {
    return conversationMemory.getContext();
  };

  return {
    messages,
    loading,
    addMessage,
    archiveConversation,
    clearConversation,
    loadConversation,
    // Enhanced memory methods
    addFoodAction,
    updateConversationState,
    getConversationContext,
    conversationMemory: conversationMemory.getContextForAI()
  };
};