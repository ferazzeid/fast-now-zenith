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
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline' | 'error'>('saved');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user } = useAuth();
  const { toast } = useToast();

  // Enhanced conversation memory integration with localStorage backup
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

  // Connection monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSaveStatus('saved');
      // Attempt to sync any offline changes
      if (messages.length > 0) {
        retryPendingSaves();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSaveStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [messages]);

  // Retry pending saves when connection is restored
  const retryPendingSaves = async () => {
    if (!user || !isOnline) return;
    
    try {
      setSaveStatus('saving');
      await saveToDatabase(messages);
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error retrying save:', error);
      setSaveStatus('error');
    }
  };

  // Save messages to database with error handling
  const saveToDatabase = async (messagesToSave: Message[]) => {
    if (!user) return;

    // Save to localStorage as backup
    const messagesForStorage = messagesToSave.map(msg => ({
      ...msg,
      timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : msg.timestamp.toISOString()
    }));
    localStorage.setItem(`conversation_backup_${user.id}`, JSON.stringify(messagesForStorage));

    // Serialize messages for database
    const messagesForDb = messagesToSave.map(msg => ({
      ...msg,
      timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : msg.timestamp.toISOString()
    }));

    console.log('DEBUG: Saving to database, total messages:', messagesForDb.length);

    // Check if conversation exists
    const { data: conversations, error: queryError } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('last_message_at', { ascending: false })
      .limit(1);

    if (queryError) throw queryError;

    const existingConversation = conversations && conversations.length > 0 ? conversations[0] : null;

    if (existingConversation) {
      console.log('DEBUG: Updating existing conversation:', existingConversation.id);
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
      const title = messagesToSave.length > 0 
        ? messagesToSave[0].content.slice(0, 50) + (messagesToSave[0].content.length > 50 ? '...' : '')
        : 'New Conversation';
      
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
        console.log('DEBUG: No conversation found, checking localStorage backup');
        
        // Try to restore from localStorage backup
        const backupKey = `conversation_backup_${user.id}`;
        const backup = localStorage.getItem(backupKey);
        
        if (backup) {
          try {
            const backupMessages = JSON.parse(backup);
            const transformedMessages = backupMessages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            console.log('DEBUG: Restored', transformedMessages.length, 'messages from localStorage backup');
            setMessages(transformedMessages);
            
            // Try to save backup to database
            if (isOnline) {
              try {
                await saveToDatabase(transformedMessages);
                localStorage.removeItem(backupKey); // Clear backup after successful sync
                console.log('DEBUG: Backup synced to database successfully');
              } catch (error) {
                console.error('Error syncing backup to database:', error);
              }
            }
            loadConversationMemory();
            return;
          } catch (error) {
            console.error('Error parsing backup messages:', error);
          }
        }
        
        console.log('DEBUG: Starting fresh conversation');
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

  // Add message to the conversation with robust error handling
  const addMessage = async (message: Message) => {
    if (!user) return false;

    console.log('DEBUG: addMessage called with:', message);
    setIsProcessingMessage(true);
    setSaveStatus('saving');

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

      // Save conversation memory and cross-session learnings
      saveConversationMemory();
      await conversationMemory.saveCrossSessionLearnings();

      if (isOnline) {
        try {
          await saveToDatabase(updatedMessages);
          setSaveStatus('saved');
          console.log('DEBUG: Message saved successfully to database');
        } catch (error) {
          console.error('Error saving to database:', error);
          setSaveStatus('error');
          // Still keep local state and localStorage backup
          toast({
            title: "Warning", 
            description: "Message saved locally, will sync when connection is restored",
            variant: "default",
          });
        }
      } else {
        setSaveStatus('offline');
        console.log('DEBUG: Offline - message saved to localStorage backup');
      }

      return true;
    } catch (error) {
      console.error('Error adding message:', error);
      setSaveStatus('error');
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

  // Export/Import for manual backup
  const exportConversation = () => {
    return JSON.stringify({
      messages: messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      })),
      conversationMemory: conversationMemory.export(),
      exportedAt: new Date().toISOString()
    });
  };

  const importConversation = async (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      const importedMessages = data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      
      setMessages(importedMessages);
      
      if (data.conversationMemory) {
        conversationMemory.import(data.conversationMemory);
        saveConversationMemory();
      }
      
      // Save to database
      if (isOnline) {
        await saveToDatabase(importedMessages);
      }
      
      toast({
        title: "Success",
        description: "Conversation imported successfully",
      });
    } catch (error) {
      console.error('Error importing conversation:', error);
      toast({
        title: "Error", 
        description: "Failed to import conversation",
        variant: "destructive",
      });
    }
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
    conversationMemory: conversationMemory.getContextForAI(),
    // Persistence status and utilities
    saveStatus,
    isOnline,
    exportConversation,
    importConversation
  };
};