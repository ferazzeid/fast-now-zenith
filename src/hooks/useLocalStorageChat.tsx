import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { conversationMemory } from '@/utils/conversationMemory';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const MAX_MESSAGES = 100; // Keep last 100 messages max

export const useLocalStorageChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { user } = useAuth();

  // Get storage key for this user
  const getStorageKey = () => {
    if (!user?.id) return null;
    return `modal_chat_${user.id}`;
  };

  // Load messages from localStorage
  const loadConversation = async () => {
    const storageKey = getStorageKey();
    if (!storageKey) {
      setMessages([]);
      return;
    }

    try {
      // Initialize conversation memory
      await conversationMemory.initializeWithUser(user!.id);

      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const storedMessages = JSON.parse(stored);
        const transformedMessages = storedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        console.log('DEBUG: Loaded', transformedMessages.length, 'messages from localStorage');
        setMessages(transformedMessages);
      } else {
        console.log('DEBUG: No stored conversation, starting fresh');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      setMessages([]);
    }
  };

  // Save messages to localStorage
  const saveMessages = (messagesToSave: Message[]) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    // Keep only the last MAX_MESSAGES
    const trimmedMessages = messagesToSave.slice(-MAX_MESSAGES);
    
    // Serialize messages with timestamps as ISO strings
    const messagesForStorage = trimmedMessages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString()
    }));

    localStorage.setItem(storageKey, JSON.stringify(messagesForStorage));
    console.log('DEBUG: Saved', messagesForStorage.length, 'messages to localStorage');
  };

  // Add message to conversation
  const addMessage = async (message: Message) => {
    if (!user) return false;

    console.log('DEBUG: addMessage called with:', message);

    try {
      // Check if this is a food clarification before processing
      const foodClarification = conversationMemory.detectFoodClarification(message.content);
      if (foodClarification.isModification) {
        console.log('DEBUG: Detected food clarification:', foodClarification);
        conversationMemory.updateConversationState({ 
          awaitingClarification: false,
          isProcessingFood: true 
        });
      }

      // Update local state and save to localStorage
      const updatedMessages = [...messages, message];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);

      return true;
    } catch (error) {
      console.error('Error adding message:', error);
      return false;
    }
  };

  // Clear conversation
  const clearConversation = async () => {
    const storageKey = getStorageKey();
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
    setMessages([]);
    
    // Reset conversation memory
    conversationMemory.updateConversationState({ 
      currentTopic: 'general',
      isProcessingFood: false,
      awaitingClarification: false,
      sessionType: 'general'
    });
  };

  // Load conversation when user changes
  useEffect(() => {
    if (user) {
      loadConversation();
    } else {
      setMessages([]);
    }
  }, [user?.id]);

  // Enhanced methods for working with conversation memory
  const addFoodAction = (userMessage: string, foods: any[], type: 'add' | 'modify' | 'delete' = 'add') => {
    conversationMemory.addFoodAction(userMessage, foods, type);
  };

  const updateConversationState = (updates: any) => {
    conversationMemory.updateConversationState(updates);
  };

  const getConversationContext = () => {
    return conversationMemory.getContext();
  };

  return {
    messages,
    loading: false, // localStorage is synchronous
    addMessage,
    loadConversation,
    clearConversation,
    // Enhanced memory methods
    addFoodAction,
    updateConversationState,
    getConversationContext,
    // Compatibility properties
    saveStatus: 'saved' as const, // Always saved in localStorage
    isOnline: true // Not relevant for localStorage
  };
};
