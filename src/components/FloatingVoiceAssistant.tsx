import { useState, useRef, useEffect } from 'react';
import { Mic, MessageCircle, X, Send, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { ChatBubble } from '@/components/ChatBubble';
import { PremiumGate } from '@/components/PremiumGate';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useFastingSession } from '@/hooks/useFastingSession';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useProfile } from '@/hooks/useProfile';
import { useFoodContext } from '@/hooks/useFoodContext';
import { useMotivators } from '@/hooks/useMotivators';
import { useAudioManager } from '@/hooks/useAudioManager';
import { useFoodEditingActions } from '@/hooks/useFoodEditingActions';
import { conversationMemory } from '@/utils/conversationMemory';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const FloatingVoiceAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [processingMessageId, setProcessingMessageId] = useState<string | null>(null);
  const [pendingFoods, setPendingFoods] = useState<any[]>([]);
  const [selectedFoodIds, setSelectedFoodIds] = useState<Set<number>>(new Set());
  const [editingFoodIndex, setEditingFoodIndex] = useState<number | null>(null);
  const [inlineEditData, setInlineEditData] = useState<{[key: number]: any}>({});
  const { user } = useAuth();
  const messagesRef = useRef<HTMLDivElement>(null);
  
  // Import session hooks for actual function execution
  const { currentSession: fastingSession, startFastingSession, endFastingSession } = useFastingSession();
  const { currentSession: walkingSession, startWalkingSession, endWalkingSession } = useWalkingSession();
  const { profile } = useProfile();
  const { context: foodContext, buildContextString, refreshContext } = useFoodContext();
  const { updateMotivator, deleteMotivator } = useMotivators();
  const { queueTextForAudio, queueStreamingTextForAudio, clearQueue, isProcessing: audioProcessing } = useAudioManager();
  const { searchFoodsForEdit, editFoodEntry, applyEditPreview, createEditPreview } = useFoodEditingActions();

  const scrollToBottom = () => {
    if (messagesRef.current) {
      const scrollContainer = messagesRef.current;
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
    // Also scroll with a small delay to account for content rendering
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Ensure scrolling when processing state changes
  useEffect(() => {
    if (isProcessing) {
      scrollToBottom();
    }
  }, [isProcessing]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    console.log('💬 Adding message:', { role, content: content.substring(0, 50) + '...' });
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => {
      const updated = [...prev, newMessage];
      console.log('💬 Messages state updated, total messages:', updated.length);
      return updated;
    });
    
    return newMessage.id;
  };

  const updateMessage = (messageId: string, content: string) => {
    console.log('💬 Updating message:', { messageId, content: content.substring(0, 50) + '...' });
    
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, content } : msg
    ));
  };

  const addProcessingMessage = (role: 'user' | 'assistant', initialContent: string) => {
    const messageId = addMessage(role, initialContent);
    if (role === 'assistant') {
      setProcessingMessageId(messageId);
    }
    return messageId;
  };

  const sendToAIOptimistic = async (message: string, fromVoice = false, processingMessageId?: string) => {
    console.log('🤖 AI Chat: Starting optimistic request with message:', message);
    
    if (!user || isProcessing) {
      console.log('🤖 AI Chat: Blocked - no user or already processing');
      return;
    }

    setIsProcessing(true);

    try {
      // Import conversation memory dynamically  
      const { conversationMemory } = await import('../utils/conversationMemory');
      
      // Initialize conversation memory with user context
      await conversationMemory.initializeWithUser(user.id);
      
      // Check if this message is a response to a pending clarification
      const isResponseToClarification = conversationMemory.isResponseToPendingClarification(message);
      if (isResponseToClarification) {
        console.log('🔍 Detected response to pending clarification');
        
        // Extract modification data from user response
        const extractedData = conversationMemory.extractModificationFromResponse(message);
        console.log('📊 Extracted modification data:', extractedData);
        
        // Add clarification response to working memory
        conversationMemory.addToWorkingMemory(
          'session',
          `User clarification response: "${message}" → Modifications: ${JSON.stringify(extractedData)}`,
          1.0,
          30 // 30 minutes TTL
        );
        
        // Clear the pending clarification since user responded
        conversationMemory.clearPendingClarification();
      }
      
      // Get enhanced context for AI including clarification state
      const conversationContext = await conversationMemory.getContextForAI();
      console.log('📝 Conversation context for AI:', conversationContext);

      // Get current page context
      const currentPath = window.location.pathname;
      const pageContext = getPageContext(currentPath);

      // Enhanced system prompt with conversation context and clarification awareness
      const systemPrompt = `You are a helpful assistant for a fasting and health tracking app. Help users with app features, calculations, unit conversions, and guidance. Current page: ${pageContext}

${conversationContext}

CLARIFICATION HANDLING:
- If you detect that the user is answering a previous clarification question, use the modify_recent_foods function immediately
- Look for direct responses like "150g each", "only 2", "140 grams per serving"
- When user provides serving sizes or quantities as simple responses, interpret them as answers to recent clarification requests
- Always include context about which food items when calling modify_recent_foods

AMBIGUITY RESOLUTION:
- When operations return 0 results or are unclear, ALWAYS ask for clarification
- For food modifications, if multiple foods match (e.g., "white fish" vs "black fish"), ask "Which food did you mean - the white fish or the black fish?"
- For serving size changes, if unclear, ask "What serving size did you want for [specific food]?"
- When editing fails, ask specific clarifying questions instead of giving generic error messages
- Be proactive in asking for details when user requests are ambiguous`;

      console.log('🤖 AI Chat: Making streaming request');

      // Use streaming API with proper auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch('https://texnkijwcygodtywgedm.supabase.co/functions/v1/chat-completion', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleG5raWp3Y3lnb2R0eXdnZWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQ3MDAsImV4cCI6MjA2ODc2MDcwMH0.xiOD9aVsKZCadtKiwPGnFQONjLQlaqk-ASUdLDZHNqI',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          stream: true,
          conversationMemory: conversationContext
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body available');
      }

      console.log('🌊 Processing streaming response...');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamedContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('🌊 Streaming complete');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                
                if (parsed.type === 'chunk' && parsed.content) {
                  // Update the processing message with streaming content
                  streamedContent += parsed.content;
                  
                  if (processingMessageId) {
                    updateMessage(processingMessageId, streamedContent);
                  }

                  // Start generating audio for chunks while streaming (Phase 3 improvement)
                  if (fromVoice && streamedContent.length > 100) {
                    // Generate audio for chunks of meaningful content
                    const sentences = streamedContent.match(/[^.!?]*[.!?]/g);
                    if (sentences && sentences.length > 0) {
                      const lastSentence = sentences[sentences.length - 1].trim();
                      if (lastSentence.length > 20) {
                        queueStreamingTextForAudio(lastSentence);
                      }
                    }
                  }
                } else if (parsed.type === 'completion' && parsed.done) {
                   // Handle final completion with function calls
                   console.log('🤖 AI Chat: Final completion received');
                   
                   let finalResponse = '';

                   // Save conversation memory with enhanced context tracking
                   if (parsed.completion && parsed.completion.includes('?')) {
                     // Check if AI is asking a clarification question
                     const questionPatterns = [
                       /serving size/i,
                       /how many/i,
                       /confirm/i,
                       /clarif/i,
                       /which/i,
                       /what.*size/i
                     ];
                     
                     if (questionPatterns.some(pattern => pattern.test(parsed.completion))) {
                       console.log('🤔 AI asking clarification question, setting pending clarification');
                       const clarificationType = parsed.completion.toLowerCase().includes('serving') ? 'serving_size' :
                                               parsed.completion.toLowerCase().includes('many') ? 'quantity' :
                                               'general';
                       
                       await conversationMemory.setPendingClarification(
                         clarificationType,
                         parsed.completion,
                         'last_food_action'
                       );
                     }
                   }
                   
                   // Save conversation memory after interaction
                   await conversationMemory.saveCrossSessionLearnings();

                  // Handle function calls first - ACTUALLY EXECUTE THEM
                  if (parsed.functionCall) {
                    console.log('🤖 AI Chat: Function call detected:', parsed.functionCall.name);
                    
                    try {
                      // Parse function arguments if it's a string
                      let functionArgs = parsed.functionCall.arguments;
                      if (typeof functionArgs === 'string') {
                        functionArgs = JSON.parse(functionArgs);
                      }

                      switch (parsed.functionCall.name) {
                        case 'add_multiple_foods':
                          finalResponse = await handleAddMultipleFoods(functionArgs);
                          break;
                        case 'create_motivator':
                          finalResponse = await handleCreateMotivator(functionArgs);
                          break;
                        case 'create_multiple_motivators':
                          finalResponse = await handleCreateMultipleMotivators(functionArgs);
                          break;
                        case 'edit_motivator':
                          finalResponse = await handleEditMotivator(functionArgs);
                          break;
                        case 'delete_motivator':
                          finalResponse = await handleDeleteMotivator(functionArgs);
                          break;
                        case 'start_fasting_session':
                          finalResponse = await handleStartFastingSession(functionArgs);
                          break;
                        case 'stop_fasting_session':
                          finalResponse = await handleStopFastingSession();
                          break;
                        case 'start_walking_session':
                          finalResponse = await handleStartWalkingSession(functionArgs);
                          break;
                        case 'stop_walking_session':
                          finalResponse = await handleStopWalkingSession();
                          break;
                        case 'modify_recent_foods':
                          finalResponse = await handleModifyRecentFoods(functionArgs);
                          break;
                        default:
                          finalResponse = 'I processed your request successfully.';
                      }
                    } catch (error) {
                      console.error('🤖 AI Chat: Function execution error:', error);
                      finalResponse = 'Sorry, I had trouble processing that request. Please try again.';
                    }

                    // Update message with function result
                    if (processingMessageId && finalResponse) {
                      updateMessage(processingMessageId, finalResponse);
                    }
                  }
                  // Handle regular completion responses  
                  else if (parsed.completion && parsed.completion.trim()) {
                    console.log('🤖 AI Chat: Using completion response:', parsed.completion);
                    finalResponse = parsed.completion;
                    
                    if (processingMessageId) {
                      updateMessage(processingMessageId, finalResponse);
                    }
                  }
                  // Handle empty responses gracefully
                  else if (!streamedContent.trim()) {
                    console.log('🤖 AI Chat: Empty response received, providing fallback message');
                    finalResponse = 'I heard you, but I\'m not sure how to help with that. Could you try asking differently?';
                    
                    if (processingMessageId) {
                      updateMessage(processingMessageId, finalResponse);
                    }
                  }

                  // Queue remaining audio if from voice and we have a response (Phase 3 improvement)
                  if (fromVoice && (finalResponse || streamedContent)) {
                    const textToQueue = finalResponse || streamedContent;
                    // Check if we haven't already queued this content
                    const sentences = textToQueue.match(/[^.!?]*[.!?]/g) || [textToQueue];
                    const remainingSentences = sentences.slice(-Math.ceil(sentences.length / 2));
                    if (remainingSentences.length > 0) {
                      queueTextForAudio(remainingSentences.join(' '));
                    }
                  }
                }
              } catch (e) {
                console.error('❌ Error parsing streaming data:', e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      console.log('🤖 AI Chat: Successfully processed streaming response');
    } catch (error) {
      console.error('🤖 AI Chat: Error occurred:', error);
      
      // Update processing message with error or show error toast
      if (processingMessageId) {
        updateMessage(processingMessageId, 'Sorry, I had trouble processing that request. Please try again.');
      } else {
        toast({
          title: "Error",
          description: "Failed to get AI response. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      console.log('🤖 AI Chat: Finished processing, setting isProcessing to false');
      setIsProcessing(false);
      setProcessingMessageId(null);
    }
  };
  // Legacy function maintained for compatibility - now uses audio manager
  const playTextAsAudio = async (text: string) => {
    console.log('🎵 Legacy playTextAsAudio called, routing to audio manager');
    queueTextForAudio(text);
  };

  const getPageContext = (path: string): string => {
    switch (path) {
      case '/walking':
        return 'Walking page - user can start/stop walking sessions, view walking history, and track calories burned';
      case '/timer':
        return 'Fasting timer page - user can start/stop fasting sessions and see fasting progress';
      case '/food-tracking':
        return 'Food tracking page - user can add food entries, track calories and carbs';
      case '/motivators':
        return 'Motivators page - user can view and manage personal motivation cards';
      case '/settings':
        return 'Settings page - user can configure their profile, goals, and app preferences';
      default:
        return 'Main app interface for fasting and health tracking';
    }
  };

  const handleVoiceTranscription = (transcription: string) => {
    console.log('🎤 FloatingVoiceAssistant: handleVoiceTranscription called with:', transcription);
    if (transcription.trim()) {
      console.log('🎤 FloatingVoiceAssistant: Opening chat and immediately showing processing state');
      setIsOpen(true); // Show chat when voice message received
      
      // Immediately add user message and processing indicator
      addMessage('user', transcription);
      const processingId = addProcessingMessage('assistant', '🧠 Processing your request...');
      
      // Start AI processing immediately with optimistic updates
      sendToAIOptimistic(transcription, true, processingId);
    } else {
      console.log('🎤 FloatingVoiceAssistant: Empty transcription, ignoring');
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() && !isProcessing) {
      setIsOpen(true); // Show chat when text message sent
      
      // Add processing message immediately for text input too
      const userMessageId = addMessage('user', inputMessage);
      const processingId = addProcessingMessage('assistant', '🧠 Processing your request...');
      
      // Start AI processing with optimistic updates
      sendToAIOptimistic(inputMessage, false, processingId);
      setInputMessage('');
      setShowInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Function execution handlers - Show food preview instead of immediate addition
  const handleAddMultipleFoods = async (args: any): Promise<string> => {
    const foods = args?.foods || [];
    console.log('🍽️ handleAddMultipleFoods called with:', foods);
    
    if (foods.length === 0) return 'No foods to add.';

    // Show food preview instead of immediate insertion
    setPendingFoods(foods);
    setSelectedFoodIds(new Set(foods.map((_: any, index: number) => index)));
    
    return ''; // Return empty to prevent message, we'll show the preview UI
  };

  const confirmAddFoods = async () => {
    const selectedFoods = pendingFoods.filter((_, index) => selectedFoodIds.has(index));
    
    if (selectedFoods.length === 0) {
      toast({
        title: "No foods selected",
        description: "Please select at least one food to add.",
        variant: "destructive"
      });
      return;
    }

    try {
      for (const food of selectedFoods) {
        const { error } = await supabase
          .from('food_entries')
          .insert({
            user_id: user!.id,
            name: food.name,
            serving_size: food.serving_size || 100,
            calories: food.calories || 0,
            carbs: food.carbs || 0,
            source_date: new Date().toISOString().split('T')[0]
          });

        if (error) throw error;
      }

      await refreshContext();
      
      const totalCalories = selectedFoods.reduce((sum: number, food: any) => sum + (food.calories || 0), 0);
      const foodList = selectedFoods.map((food: any) => `${food.name} (${food.serving_size}g)`).join(', ');
      
      setPendingFoods([]);
      setSelectedFoodIds(new Set());
      
      addMessage('assistant', `Added ${foodList} - ${totalCalories} calories total`);
      
      toast({
        title: "Foods added successfully",
        description: `Added ${selectedFoods.length} food${selectedFoods.length === 1 ? '' : 's'}`,
      });
    } catch (error) {
      console.error('🍽️ Error adding foods:', error);
      toast({
        title: "Error adding foods",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const removePendingFood = (index: number) => {
    setPendingFoods(prev => prev.filter((_, i) => i !== index));
    setSelectedFoodIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      // Re-index remaining items
      const updatedSet = new Set<number>();
      Array.from(newSet).forEach(id => {
        if (id < index) {
          updatedSet.add(id);
        } else if (id > index) {
          updatedSet.add(id - 1);
        }
      });
      return updatedSet;
    });
  };

  const updatePendingFood = (index: number, updates: any) => {
    setPendingFoods(prev => 
      prev.map((food, i) => i === index ? { ...food, ...updates } : food)
    );
  };

  const toggleFoodSelection = (index: number) => {
    setSelectedFoodIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Enhanced food modification handler
  const handleModifyRecentFoods = async (args: any): Promise<string> => {
    try {
      const modifications = args?.modifications || {};
      const clarificationText = args?.clarification_text || '';
      console.log('🔄 Processing food modification:', modifications, clarificationText);

      // First try to modify pending foods if available
      if (pendingFoods.length > 0) {
        const context = conversationMemory.getContext();
        const recentAction = context.recentFoodActions[0];
        
        if (recentAction) {
          const modifiedFoods = conversationMemory.processModification(recentAction, modifications, pendingFoods);
          
          if (modifiedFoods && modifiedFoods.length > 0) {
            setPendingFoods(modifiedFoods);
            const foodNames = modifiedFoods.map(food => food.name).join(', ');
            return `Updated ${foodNames} in preview. Please confirm to save the changes.`;
          }
        }
      }

      // If no pending foods, search recent foods in database
      const searchTerms = ['greek yogurt', 'yogurt', 'cucumber', 'brie', 'feta'];
      let foundFoods: any[] = [];
      
      for (const term of searchTerms) {
        try {
          const results = await searchFoodsForEdit(term, 'today');
          if (results.length > 0) {
            foundFoods = [...foundFoods, ...results];
          }
        } catch (error) {
          console.log(`No results for ${term}:`, error);
        }
      }

      if (foundFoods.length === 0) {
        return 'I couldn\'t find any recent foods to modify. Please try adding the foods first, then making changes.';
      }

      // Apply modifications to found foods
      let modifiedCount = 0;
      const modificationPromises = foundFoods.map(async (food) => {
        try {
          const updates: any = {};
          
          // Handle serving size modifications
          if (modifications.serving_size_each) {
            updates.serving_size = modifications.serving_size_each;
          }
          if (modifications.serving_size) {
            updates.serving_size = modifications.serving_size;
          }

          // Recalculate calories and carbs based on new serving size if needed
          if (updates.serving_size && food.current_values) {
            const multiplier = updates.serving_size / (food.current_values.serving_size || 100);
            if (food.current_values.calories) {
              updates.calories = Math.round(food.current_values.calories * multiplier);
            }
            if (food.current_values.carbs) {
              updates.carbs = Math.round(food.current_values.carbs * multiplier * 10) / 10;
            }
          }

          if (Object.keys(updates).length > 0) {
            await editFoodEntry(food.id, updates);
            modifiedCount++;
            return food;
          }
        } catch (error) {
          console.error('Error modifying food:', food.name, error);
        }
        return null;
      });

      const results = await Promise.all(modificationPromises);
      const successful = results.filter(r => r !== null);

      if (modifiedCount > 0) {
        await refreshContext(); // Refresh food context after modifications
        const foodNames = successful.map(f => f?.name).join(', ');
        return `Successfully updated ${modifiedCount} food${modifiedCount === 1 ? '' : 's'}: ${foodNames}`;
      } else {
        // Ask for clarification when no foods were updated
        const availableFoodNames = foundFoods.map(food => food.name).join(', ');
        if (foundFoods.length > 1) {
          return `I found multiple foods: ${availableFoodNames}. Which specific food did you want to modify?`;
        } else if (foundFoods.length === 1) {
          return `I found "${foundFoods[0].name}" but couldn't apply the changes. What specific modification did you want to make?`;
        } else {
          return 'I couldn\'t find any recent foods matching your request. Could you be more specific about which food you want to modify?';
        }
      }

    } catch (error) {
      console.error('Error modifying foods:', error);
      return 'Sorry, I had trouble modifying those foods. Please try again or add the foods manually.';
    }
  };

  const handleCreateMotivator = async (args: any): Promise<string> => {
    try {
      // Generate a slug from the title for user-created motivators
      const baseSlug = args.title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-');
      const uniqueSlug = `${baseSlug}-${Date.now()}`;

      const { data, error } = await supabase
        .from('motivators')
        .insert({
          user_id: user!.id,
          title: args.title,
          content: args.content,
          category: args.category || 'general',
          slug: uniqueSlug,
          is_active: true,
          is_system_goal: false
        });

      if (error) throw error;
      return `Created motivator: "${args.title}"`;
    } catch (error) {
      console.error('Error creating motivator:', error);
      return 'Sorry, I had trouble creating that motivator.';
    }
  };

  const handleCreateMultipleMotivators = async (args: any): Promise<string> => {
    const motivators = args?.motivators || [];
    if (motivators.length === 0) return 'No motivators to create.';

    try {
      const motivatorData = motivators.map((motivator: any, index: number) => {
        const baseSlug = motivator.title.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
        const uniqueSlug = `${baseSlug}-${Date.now()}-${index}`;
        
        return {
          user_id: user!.id,
          title: motivator.title,
          content: motivator.content,
          category: motivator.category || 'general',
          slug: uniqueSlug,
          is_active: true,
          is_system_goal: false
        };
      });

      const { data, error } = await supabase
        .from('motivators')
        .insert(motivatorData);

      if (error) throw error;
      return `Created ${motivators.length} motivators successfully!`;
    } catch (error) {
      console.error('Error creating motivators:', error);
      return 'Sorry, I had trouble creating those motivators.';
    }
  };

  const handleStartFastingSession = async (args: any): Promise<string> => {
    try {
      if (fastingSession) {
        return 'You already have an active fasting session running.';
      }
      
      await startFastingSession(16 * 60 * 60); // 16 hours in seconds
      return 'Fasting session started! Good luck with your fast.';
    } catch (error) {
      console.error('Error starting fasting session:', error);
      return 'Sorry, I had trouble starting your fasting session.';
    }
  };

  const handleStopFastingSession = async (): Promise<string> => {
    try {
      if (!fastingSession) {
        return 'You don\'t have an active fasting session to stop.';
      }
      
      await endFastingSession();
      return 'Fasting session completed! Great work on your fast.';
    } catch (error) {
      console.error('Error stopping fasting session:', error);
      return 'Sorry, I had trouble stopping your fasting session.';
    }
  };

  const handleStartWalkingSession = async (args: any): Promise<string> => {
    try {
      if (walkingSession) {
        return 'You already have an active walking session running.';
      }
      
      await startWalkingSession();
      return 'Walking session started! Enjoy your walk.';
    } catch (error) {
      console.error('Error starting walking session:', error);
      return 'Sorry, I had trouble starting your walking session.';
    }
  };

  const handleStopWalkingSession = async (): Promise<string> => {
    try {
      if (!walkingSession) {
        return 'You don\'t have an active walking session to stop.';
      }
      
      await endWalkingSession();
      return 'Walking session completed! Well done.';
    } catch (error) {
      console.error('Error stopping walking session:', error);
      return 'Sorry, I had trouble stopping your walking session.';
    }
  };

  const handleEditMotivator = async (args: any): Promise<string> => {
    try {
      const { motivator_id, updates } = args;
      await updateMotivator(motivator_id, updates);
      return `Updated motivator: "${updates.title || 'motivator'}"`;
    } catch (error) {
      console.error('Error editing motivator:', error);
      return 'Sorry, I had trouble editing that motivator.';
    }
  };

  const handleDeleteMotivator = async (args: any): Promise<string> => {
    try {
      const { motivator_id } = args;
      await deleteMotivator(motivator_id);
      return 'Motivator deleted successfully.';
    } catch (error) {
      console.error('Error deleting motivator:', error);
      return 'Sorry, I had trouble deleting that motivator.';
    }
  };

  const clearChat = () => {
    setMessages([]);
    setIsOpen(false);
    setShowInput(false);
    setPendingFoods([]);
    setSelectedFoodIds(new Set());
    setEditingFoodIndex(null);
    setInlineEditData({});
    clearQueue(); // Clear audio queue when clearing chat
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
      {/* Sticky Food Preview Section - Fixed at top */}
      {isOpen && pendingFoods.length > 0 && (
        <div className="fixed bottom-[380px] right-4 md:right-6 w-full max-w-sm md:w-80 z-[60]">
          <Card className="bg-background/98 backdrop-blur-md border-border shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-xs">Review Foods ({pendingFoods.length})</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 text-xs"
                  onClick={() => {
                    setPendingFoods([]);
                    setSelectedFoodIds(new Set());
                    setEditingFoodIndex(null);
                    setInlineEditData({});
                  }}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {pendingFoods.map((food, index) => (
                  <div key={index} className="flex items-center gap-2 p-1.5 rounded border border-border/30 text-xs">
                    <Checkbox
                      checked={selectedFoodIds.has(index)}
                      onCheckedChange={() => toggleFoodSelection(index)}
                      className="shrink-0 h-3 w-3"
                    />
                    
                    {editingFoodIndex === index ? (
                      <div className="flex-1 grid grid-cols-2 gap-1">
                        <Input
                          value={inlineEditData[index]?.name ?? food.name}
                          onChange={(e) => setInlineEditData(prev => ({
                            ...prev,
                            [index]: { ...prev[index], name: e.target.value }
                          }))}
                          className="text-xs h-6"
                        />
                        <Input
                          type="number"
                          value={inlineEditData[index]?.serving_size ?? food.serving_size}
                          onChange={(e) => setInlineEditData(prev => ({
                            ...prev,
                            [index]: { ...prev[index], serving_size: parseFloat(e.target.value) || 0 }
                          }))}
                          className="text-xs h-6"
                        />
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{food.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {food.serving_size}g • {Math.round(food.calories)}cal
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-0.5">
                      {editingFoodIndex === index ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={() => {
                              if (inlineEditData[index]) {
                                updatePendingFood(index, inlineEditData[index]);
                              }
                              setEditingFoodIndex(null);
                            }}
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={() => setEditingFoodIndex(null)}
                          >
                            ✕
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={() => setEditingFoodIndex(index)}
                          >
                            <Edit className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={() => removePendingFood(index)}
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={confirmAddFoods}
                  disabled={selectedFoodIds.size === 0}
                  className="flex-1 h-7 text-xs"
                >
                  Add ({selectedFoodIds.size})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat Messages - Separate container for better scrolling */}
      {isOpen && messages.length > 0 && (
        <div 
          ref={messagesRef}
          className="absolute bottom-28 right-0 w-full max-w-sm md:w-80 max-h-96 overflow-y-auto space-y-3 pb-6 pr-2 scroll-smooth"
        >
          {messages.map((message, index) => (
            <ChatBubble
              key={message.id}
              message={message}
              isLast={index === messages.length - 1}
              onDismiss={() => {
                setMessages(prev => prev.filter(m => m.id !== message.id));
              }}
            />
          ))}
        </div>
      )}

      {/* Text Input */}
      {showInput && (
        <div className="absolute bottom-20 right-0 w-full max-w-sm md:w-80 mb-2">
          <div className="flex gap-2 p-3 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about the app..."
              className="flex-1"
              autoFocus
            />
            <Button 
              size="sm" 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isProcessing}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Button */}
      <div className="flex items-center gap-2">
        {/* Clear Chat Button */}
        {isOpen && (messages.length > 0 || pendingFoods.length > 0) && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className="animate-fade-in"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Text Chat Toggle */}
        <Button
          variant={showInput ? "default" : "outline"}
          size="sm"
          onClick={() => setShowInput(!showInput)}
          className="animate-fade-in"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>

        {/* Voice Button */}
        <PremiumGate feature="voice_chat">
          <div className="shadow-lg hover:shadow-xl transition-shadow">
            <CircularVoiceButton
              onTranscription={handleVoiceTranscription}
              isDisabled={isProcessing}
            />
          </div>
        </PremiumGate>
      </div>

      {/* Processing Indicator - Tiny brain at bottom */}
      {isProcessing && (
        <div className="fixed bottom-2 right-2 z-50 flex items-center gap-1 bg-background/90 backdrop-blur-sm border border-border rounded-full px-2 py-1 shadow-lg text-xs">
          <div className="text-lg animate-pulse">🧠</div>
          <span className="text-xs text-muted-foreground hidden sm:inline">thinking...</span>
        </div>
      )}
    </div>
  );
};