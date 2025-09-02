import { useState, useEffect, useRef } from 'react';
import { Send, X, Edit, Mic, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { UniversalModal } from '@/components/ui/universal-modal';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { useAuth } from '@/hooks/useAuth';
import { PremiumGate } from '@/components/PremiumGate';
import { useFoodEditingActions } from '@/hooks/useFoodEditingActions';
import { FoodEditPreview } from '@/components/FoodEditPreview';
import { Checkbox } from '@/components/ui/checkbox';
import { useFastingSession } from '@/hooks/useFastingSession';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useProfile } from '@/hooks/useProfile';
import { useAccess } from '@/hooks/useAccess';
import { useDailyDeficitQuery } from '@/hooks/optimized/useDailyDeficitQuery';
import { useSingleConversation } from '@/hooks/useSingleConversation';
import { conversationMemory } from '@/utils/conversationMemory';
import { useGoalCalculations } from '@/hooks/useGoalCalculations';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ModalAiChatProps {
  isOpen: boolean;
  onClose: () => void;
  onResult?: (result: any) => void;
  context?: string;
  title?: string;
  systemPrompt?: string;
  conversationType?: 'general';
  proactiveMessage?: string;
  quickReplies?: string[];
  onFoodAdd?: (foods: any[], destination: string) => void;
}

export const ModalAiChat = ({ 
  isOpen, 
  onClose, 
  onResult, 
  context = '',
  title = 'AI Assistant',
  systemPrompt = 'You are a helpful AI assistant.',
  conversationType = 'general',
  proactiveMessage = '',
  quickReplies = [],
  onFoodAdd
}: ModalAiChatProps) => {

  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const [lastFoodSuggestion, setLastFoodSuggestion] = useState<any>(null);
  const [lastMotivatorSuggestion, setLastMotivatorSuggestion] = useState<any>(null);
  const [lastMotivatorsSuggestion, setLastMotivatorsSuggestion] = useState<any>(null);
  const [editingFoodIndex, setEditingFoodIndex] = useState<number | null>(null);
  const [editingMotivatorIndex, setEditingMotivatorIndex] = useState<number | null>(null);
  const [editingMotivator, setEditingMotivator] = useState(false);
  const [motivatorEditData, setMotivatorEditData] = useState<{title: string, content: string}>({title: '', content: ''});
  const [inlineEditData, setInlineEditData] = useState<{[key: number]: any}>({});
  const [inlineMotivatorEditData, setInlineMotivatorEditData] = useState<{[key: number]: any}>({});
  const [selectedFoodIds, setSelectedFoodIds] = useState<Set<number>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const calorieSummaryRef = useRef<HTMLDivElement>(null);
  const voiceButtonRef = useRef<{ stopRecording: () => void; cancelRecording: () => void }>(null);
  const { user } = useAuth();
  const {
    searchResults,
    searchFoodsForEdit,
    createEditPreview,
    applyEditPreview
  } = useFoodEditingActions();
  const [activeEditPreviews, setActiveEditPreviews] = useState<any[]>([]);
  
  // Use persistent conversation hook
  const { 
    messages,
    addMessage,
    loadConversation,
    addFoodAction, 
    updateConversationState, 
    getConversationContext 
  } = useSingleConversation();
  
  // Session and profile hooks
  const { currentSession: fastingSession, startFastingSession, endFastingSession, cancelFastingSession } = useFastingSession();
  const { 
    currentSession: walkingSession, 
    startWalkingSession, 
    endWalkingSession
  } = useWalkingSession();
  const { profile, updateProfile } = useProfile();
  const { isAdmin } = useAccess();
  const { deficitData } = useDailyDeficitQuery();
  const goalCalculations = useGoalCalculations();


  // Smart auto-scrolling that respects user scroll position
  useEffect(() => {
    if (!isUserScrolling && messages.length > 0) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, [messages, isUserScrolling]);

  // Handle scroll tracking
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsUserScrolling(!isNearBottom);
    setShowScrollButton(!isNearBottom && messages.length > 0);
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setIsUserScrolling(false);
    setShowScrollButton(false);
  };

  // Auto-scroll to calorie summary when food suggestions appear
  useEffect(() => {
    if (lastFoodSuggestion?.foods && lastFoodSuggestion.foods.length > 0) {
      setTimeout(() => {
        calorieSummaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [lastFoodSuggestion?.foods]);

  // Load conversation when modal opens, preserve history when it closes
  useEffect(() => {
    console.log('🔧 ModalAiChat useEffect triggered:', { 
      isOpen, 
      context, 
      proactiveMessage, 
      conversationType,
      isInitialized,
      currentMessagesLength: messages.length
    });
    
    if (isOpen && !isInitialized) {
      console.log('🚀 Loading conversation for modal');
      
      // Load existing conversation history
      loadConversation().then(() => {
        // If we have a proactive message and no existing conversation, add it
        if (proactiveMessage && messages.length === 0) {
          const proactiveMsg: Message = {
            role: 'assistant',
            content: proactiveMessage,
            timestamp: new Date()
          };
          addMessage(proactiveMsg);
        } else if (messages.length === 0) {
          // Add welcome message for new conversations
          let welcomeMessage = 'Hi! How can I help you today?';
          
          if (title === 'Food Assistant') {
            welcomeMessage = 'Hi! What food would you like to add? You can add multiple at once - just tell me the name and the quantity.';
          } else if (title === 'Motivator Assistant') {
            welcomeMessage = 'Hi! Let\'s create some motivational goals for you. What would you like to achieve?';
          }
          
          const welcomeMsg: Message = {
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date()
          };
          addMessage(welcomeMsg);
        }
      });
      
      setIsInitialized(true);
      setLastFoodSuggestion(null);
      setLastMotivatorSuggestion(null);
      setLastMotivatorsSuggestion(null);
      setSelectedFoodIds(new Set());
    } else if (!isOpen && isInitialized) {
      // Cancel any active recording when modal closes (don't process)
      if (voiceButtonRef.current) {
        voiceButtonRef.current.cancelRecording();
      }
      
      console.log('🔄 Modal closing - preserving chat history, clearing UI state');
      
      // Only clear UI-specific state, keep chat messages in database
      setIsInitialized(false);
      setEditingFoodIndex(null);
      setEditingMotivatorIndex(null);
      setEditingMotivator(false);
      setMotivatorEditData({title: '', content: ''});
      setInlineEditData({});
      setInlineMotivatorEditData({});
      setLastFoodSuggestion(null);
      setLastMotivatorSuggestion(null);
      setLastMotivatorsSuggestion(null);
      setSelectedFoodIds(new Set());
      setIsUserScrolling(false);
      setShowScrollButton(false);
    }
  }, [isOpen, context, conversationType, proactiveMessage, title, isInitialized]);

  const sendToAI = async (message: string, fromVoice = false) => {
    console.log('📤 sendToAI called:', { message, fromVoice, isProcessing });
    setIsProcessing(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Enhanced system prompt based on context
      let enhancedSystemPrompt = systemPrompt;
      
      if (title === 'Food Assistant') {
        enhancedSystemPrompt = `${systemPrompt}

You are a comprehensive food tracking assistant. Your goals are to:

FOR ADDING FOODS:
1. IMMEDIATELY process food information and call add_multiple_foods
2. Be concise but helpful - when users ask about your reasoning or assumptions, provide brief explanations
3. CRITICAL QUANTITY HANDLING: When users specify a COUNT of items (e.g., "two cucumbers", "three bananas", "four apples"), create SEPARATE entries for each item. DO NOT aggregate quantities.
4. EXAMPLES OF CORRECT BEHAVIOR:
   - "two cucumbers" → 2 separate cucumber entries (e.g., 150g each)
   - "three bananas each 120g" → 3 separate banana entries at 120g each
   - "400g chicken" → 1 chicken entry at 400g
   - "two Greek yogurts" → 2 separate Greek yogurt entries
   - "200g of rice" → 1 rice entry at 200g
5. Only aggregate when NO specific count is mentioned and user gives total weight
6. When making assumptions (like estimating portion sizes), briefly explain your reasoning when asked
7. Destination: default to today. If the user explicitly says template or library, pass destination accordingly

FOR EDITING/DELETING FOODS:
1. When users want to edit/change/delete/remove foods, FIRST call search_foods_for_edit to find the item
2. Context hints:
   - "today's food", "my lunch", "the chicken I ate" → context: "today"
   - "in my library", "my saved foods" → context: "library"
   - "my template" → context: "templates"
3. For deletion phrases like "I didn't eat that", "remove it", "delete the banana":
   - search_foods_for_edit first (context defaults to today)
   - then call delete_food_entry (or delete_library_food for library items)
4. For updates, after finding foods, call edit_food_entry or edit_library_food

FORMATS:
- For adding: list each as "Name (Xg) - Y cal, Zg carbs" and include Total line
- For editing/deleting: call the tool first, then a short confirmation

CRITICAL: Always use function calls for food operations.`;
      } else if (title === 'Motivator Assistant') {
        enhancedSystemPrompt = `${systemPrompt}

You are a motivational goal creation assistant. Your task is to:

**FOR SINGLE MOTIVATORS:**
1. If user mentions ONE goal/motivation, use create_motivator function
2. Extract the key motivation from what they said
3. Create a short, punchy title (3-8 words max)
4. Write compelling content that includes their specific trigger/motivation

**FOR MULTIPLE MOTIVATORS:**
1. If user mentions MULTIPLE goals/motivations, use create_multiple_motivators function
2. Parse each distinct goal into a separate motivator
3. Examples of multiple goals:
   - "I want to lose weight, feel confident, and impress my friends" = 3 motivators
   - "Create motivators for my health and fitness goals" = multiple health/fitness motivators
   - "I need goals for weight loss, exercise, and confidence" = 3 motivators

**FOR EDITING/DELETING MOTIVATORS:**
1. When users want to edit/change/modify their goals, use edit_motivator function
2. When users want to delete/remove their goals, use delete_motivator function
3. Listen for phrases like "edit my goal", "change that motivator", "delete my weight loss goal", "remove that", etc.

**CRITICAL RULES:**
- ALWAYS call the appropriate function immediately - no questions or discussions
- For multiple goals, ALWAYS use create_multiple_motivators, not individual create_motivator calls
- Create the motivators directly based on what they told you
- Each motivator should be distinct and focused on one specific goal
- Support editing and deleting motivators through voice commands`;
      }

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: { 
          messages: [
            { role: 'system', content: enhancedSystemPrompt },
            ...conversationHistory,
            { role: 'user', content: message }
          ],
          context: title === 'Food Assistant' ? 'food_only' : undefined
        }
      });

      if (error) throw error;

      console.log('🤖 AI Response received:', { data, completion: data?.completion, functionCall: data?.functionCall });

      // Handle function calls for food and motivator suggestions
      if (data.functionCall) {
        if (data.functionCall.name === 'add_multiple_foods') {
          const foods = data.functionCall.arguments?.foods || [];
          
          // Track in conversation memory
          addFoodAction(message, foods, 'add');
          
          setLastFoodSuggestion({
            foods,
            destination: data.functionCall.arguments?.destination || 'today',
            added: false
          });
          // Initialize all foods as selected
          setSelectedFoodIds(new Set(foods.map((_: any, index: number) => index)));
          
          // Add a chronological message about the food suggestion
          const foodSummary = foods.map((food: any) => 
            `${food.name} (${food.serving_size}g) - ${food.calories} cal, ${food.carbs}g carbs`
          ).join('\n');
          
          const totalCalories = foods.reduce((sum: number, food: any) => sum + food.calories, 0);
          const totalCarbs = foods.reduce((sum: number, food: any) => sum + food.carbs, 0);
          
          const foodMessage: Message = {
            role: 'assistant',
            content: `I've prepared these foods for you:\n\n${foodSummary}\n\nTotal: ${totalCalories} calories, ${totalCarbs}g carbs\n\nReview the items above and click "Add Selected Foods" when ready.`,
            timestamp: new Date()
          };
          addMessage(foodMessage);
          return;
        } else if (data.functionCall.name === 'modify_recent_foods') {
          const modifications = data.functionCall.arguments.modifications || {};
          const clarificationText = data.functionCall.arguments.clarification_text || '';
          console.log('🔄 Processing food modification:', modifications, clarificationText);

          // Use conversation memory to process the modification  
          const context = getConversationContext();
          const recentAction = context.recentFoodActions[0];
          
          if (recentAction) {
            const modifiedFoods = conversationMemory.processModification(recentAction, modifications, recentAction.foods);
            console.log('🔄 Modified foods:', modifiedFoods);
            
            // Track the modification in memory
            addFoodAction(clarificationText, modifiedFoods, 'modify');
            
            // Present modified foods for review
            setLastFoodSuggestion({
              foods: modifiedFoods,
              destination: 'today',
              added: false
            });
            setSelectedFoodIds(new Set(modifiedFoods.map((_: any, index: number) => index)));
            
            const foodSummary = modifiedFoods.map((food: any) => 
              `${food.name} (${food.serving_size}g) - ${food.calories} cal, ${food.carbs}g carbs`
            ).join('\n');
            
            const totalCalories = modifiedFoods.reduce((sum: number, food: any) => sum + food.calories, 0);
            const totalCarbs = modifiedFoods.reduce((sum: number, food: any) => sum + food.carbs, 0);
            
            const modificationMessage: Message = {
              role: 'assistant',
              content: `I've updated the foods based on your clarification:\n\n${foodSummary}\n\nTotal: ${totalCalories} calories, ${totalCarbs}g carbs\n\nReview the updated items and click "Add Selected Foods" when ready.`,
              timestamp: new Date()
            };
            addMessage(modificationMessage);
            return;
          } else {
            // No recent food action to modify - fallback to regular response
            const message: Message = {
              role: 'assistant',
              content: data.completion || "I don't see any recent food entries to modify. Could you please add some foods first?",
              timestamp: new Date()
            };
            addMessage(message);
            return;
          }
        } else if (data.functionCall.name === 'create_multiple_motivators') {
          setLastMotivatorsSuggestion(data.functionCall.arguments);
          // Don't add any AI message for bulk motivators - just show the interactive UI
          return;
        } else if (data.functionCall.name === 'create_motivator') {
          setLastMotivatorSuggestion(data.functionCall);
          // Show the actual motivator suggestion with simple formatting
          const args = data.functionCall.arguments;
          const motivatorMessage: Message = {
            role: 'assistant',
            content: `${args.title}

${args.content}`,
            timestamp: new Date()
          };
          addMessage(motivatorMessage);
          return;
        } else if (data.functionCall.name === 'search_foods_for_edit') {
          // Handle food search for editing
          const { search_term, context } = data.functionCall.arguments;
          await handleFoodSearch(search_term, context);
          return;
        } else if (data.functionCall.name === 'edit_food_entry') {
          const { entry_id, updates } = data.functionCall.arguments;
          await handleDirectFoodEdit(entry_id, updates, 'today');
          return;
        } else if (data.functionCall.name === 'edit_library_food') {
          const { food_id, updates } = data.functionCall.arguments;
          await handleDirectFoodEdit(food_id, updates, 'library');
          return;
        } else if (data.functionCall.name === 'delete_food_entry' || data.functionCall.name === 'delete_library_food') {
          // Forward deletion requests to parent handler
          await onResult?.(data.functionCall);
          return;
        }
        // === SESSION MANAGEMENT ===
        else if (data.functionCall.name === 'start_fasting_session') {
          await handleStartFastingSession(data.functionCall.arguments);
          return;
        } else if (data.functionCall.name === 'stop_fasting_session') {
          await handleStopFastingSession(data.functionCall.arguments);
          return;
        } else if (data.functionCall.name === 'start_walking_session') {
          await handleStartWalkingSession(data.functionCall.arguments);
          return;
        } else if (data.functionCall.name === 'stop_walking_session') {
          await handleStopWalkingSession();
          return;
        }
        // === STATUS QUERIES ===
        else if (data.functionCall.name === 'get_current_session_status') {
          await handleGetCurrentSessionStatus();
          return;
        } else if (data.functionCall.name === 'get_current_fast_duration') {
          await handleGetCurrentFastDuration();
          return;
        } else if (data.functionCall.name === 'get_current_walk_duration') {
          await handleGetCurrentWalkDuration();
          return;
        } else if (data.functionCall.name === 'get_today_deficit') {
          await handleGetTodayDeficit();
          return;
        }
        // === ADMIN FUNCTIONS ===
        else if (data.functionCall.name === 'add_admin_personal_log') {
          await handleAddAdminPersonalLog(data.functionCall.arguments);
          return;
        } else if (data.functionCall.name === 'get_admin_personal_log') {
          await handleGetAdminPersonalLog(data.functionCall.arguments);
          return;
        }
        // === PROFILE UPDATES ===
        else if (data.functionCall.name === 'update_weight') {
          await handleUpdateWeight(data.functionCall.arguments);
          return;
        } else if (data.functionCall.name === 'update_goal_weight') {
          await handleUpdateGoalWeight(data.functionCall.arguments);
          return;
        } else if (data.functionCall.name === 'update_daily_goals') {
          await handleUpdateDailyGoals(data.functionCall.arguments);
          return;
        } else if (data.functionCall.name === 'get_weight_loss_projection') {
          await handleGetWeightLossProjection();
          return;
        }
      }

      // Only add completion text if it exists, doesn't contain food suggestions, and no function call was processed
      if (data.completion && data.completion.trim() && !containsFoodSuggestion(data.completion) && !data.functionCall) {
        const aiMessage: Message = {
          role: 'assistant',
          content: data.completion,
          timestamp: new Date()
        };
        addMessage(aiMessage);
      }
      // If there was a function call but no completion, add a confirmation message
      else if (data.functionCall && (!data.completion || !data.completion.trim())) {
        let confirmationMessage = '';
        switch (data.functionCall.name) {
          case 'add_multiple_foods':
            // Don't add a message for food suggestions as they show the interactive UI
            break;
          case 'create_motivator':
          case 'create_multiple_motivators':
            // Don't add a message for motivator suggestions as they show the interactive UI
            break;
          case 'start_fasting_session':
            confirmationMessage = 'Fasting session started successfully!';
            break;
          case 'stop_fasting_session':
            confirmationMessage = 'Fasting session stopped. Great work!';
            break;
          case 'start_walking_session':
            confirmationMessage = 'Walking session started!';
            break;
          case 'stop_walking_session':
            confirmationMessage = 'Walking session completed successfully!';
            break;
          case 'search_foods_for_edit':
          case 'edit_food_entry':
          case 'edit_library_food':
          case 'delete_food_entry':
          case 'delete_library_food':
            confirmationMessage = 'Food operation completed successfully.';
            break;
          default:
            confirmationMessage = 'Request processed successfully.';
        }
        
        if (confirmationMessage) {
          const aiMessage: Message = {
            role: 'assistant',
            content: confirmationMessage,
            timestamp: new Date()
          };
          addMessage(aiMessage);
        }
      }

    } catch (error) {
      console.error('Error sending message to AI:', error);
      toast({
        title: "Error",
        description: (error as any)?.message || 'Failed to send message. Please try again.',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceTranscription = async (transcription: string) => {
    console.log('🎤 Voice transcription received:', transcription);
    if (!transcription.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: transcription,
      timestamp: new Date()
    };

    console.log('👤 Adding user voice message to chat');
    await addMessage(userMessage);
    await sendToAI(transcription, true);
  };

  const handleSendMessage = async (presetMessage?: string) => {
    const messageToSend = presetMessage || inputMessage.trim();
    if (!messageToSend || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    await addMessage(userMessage);

    if (!presetMessage) {
      setInputMessage('');
    }

    await sendToAI(messageToSend);
  };

  const handleInlineEdit = (foodIndex: number) => {
    if (lastFoodSuggestion?.foods && lastFoodSuggestion.foods[foodIndex]) {
      const food = lastFoodSuggestion.foods[foodIndex];
      setInlineEditData(prev => ({
        ...prev,
        [foodIndex]: {
          name: food.name || '',
          portion: food.serving_size?.toString() || '',
          calories: food.calories?.toString() || '',
          carbs: food.carbs?.toString() || ''
        }
      }));
      setEditingFoodIndex(foodIndex);
    }
  };

  const handleSaveInlineEdit = (foodIndex: number) => {
    const editData = inlineEditData[foodIndex];
    if (editData && lastFoodSuggestion?.foods) {
      // Update the food data in the lastFoodSuggestion
      const updatedFoods = [...lastFoodSuggestion.foods];
      updatedFoods[foodIndex] = {
        ...updatedFoods[foodIndex],
        name: editData.name,
        serving_size: parseInt(editData.portion) || 0,
        calories: parseInt(editData.calories) || 0,
        carbs: parseInt(editData.carbs) || 0
      };
      
      // Update the lastFoodSuggestion with new data
      setLastFoodSuggestion(prev => ({
        ...prev,
        foods: updatedFoods
      }));
      
      // Clear editing state
      setEditingFoodIndex(null);
      setInlineEditData(prev => {
        const updated = { ...prev };
        delete updated[foodIndex];
        return updated;
      });
    }
  };

  const handleCancelInlineEdit = (foodIndex: number) => {
    setEditingFoodIndex(null);
    setInlineEditData(prev => {
      const updated = { ...prev };
      delete updated[foodIndex];
      return updated;
    });
    // Don't filter the foods array when canceling edit
  };

  const handleRemoveFood = (foodIndex: number) => {
    if (lastFoodSuggestion?.foods) {
      const updatedFoods = lastFoodSuggestion.foods.filter((_, index) => index !== foodIndex);
      
      // Update the lastFoodSuggestion with filtered foods
      setLastFoodSuggestion(prev => ({
        ...prev,
        foods: updatedFoods
      }));
      
      // Update selected food IDs to remove the deleted item and adjust indices
      setSelectedFoodIds(prev => {
        const newSelected = new Set<number>();
        Array.from(prev).forEach(selectedIndex => {
          if (selectedIndex < foodIndex) {
            newSelected.add(selectedIndex);
          } else if (selectedIndex > foodIndex) {
            newSelected.add(selectedIndex - 1);
          }
          // Skip the deleted index
        });
        return newSelected;
      });
      
      // Reset editing state if we were editing the removed item
      if (editingFoodIndex === foodIndex) {
        setEditingFoodIndex(null);
        setInlineEditData(prev => {
          const updated = { ...prev };
          delete updated[foodIndex];
          return updated;
        });
      }
    }
  };

  const handleAddAllFoods = async () => {
    if (!lastFoodSuggestion?.foods || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const destination = lastFoodSuggestion.destination || 'today';
      const selectedFoods = lastFoodSuggestion.foods.filter((_: any, index: number) => 
        selectedFoodIds.has(index)
      );
      
      if (selectedFoods.length === 0) {
        toast({
          title: "No foods selected",
          description: "Please select at least one food to add.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      if (onFoodAdd) {
        await onFoodAdd(selectedFoods, destination);
      } else if (onResult) {
        await onResult({
          name: 'add_multiple_foods',
          arguments: { foods: selectedFoods, destination }
        });
      }
      
      // Mark as added
      setLastFoodSuggestion((prev: any) => ({ ...prev, added: true }));
      
      toast({
        title: "Foods added successfully",
        description: `Added ${selectedFoods.length} foods to your ${destination}`,
      });
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error adding foods:', error);
      toast({
        title: "Error",
        description: "Failed to add foods. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateMotivator = async () => {
    if (lastMotivatorSuggestion && onResult) {
      console.log('🎯 Creating motivator with data:', lastMotivatorSuggestion);
      console.log('🎯 Motivator arguments:', lastMotivatorSuggestion.arguments);
      
      try {
        // Actually create the motivator by calling the result handler
        console.log('🎯 Calling onResult with:', lastMotivatorSuggestion);
        await onResult(lastMotivatorSuggestion);
        
        // Show success message
        const successMessage: Message = {
          role: 'assistant',
          content: 'Motivator created successfully! You can now view it in your motivators list.',
          timestamp: new Date()
        };
        addMessage(successMessage);
        
        // Clear the suggestion after creating
        setLastMotivatorSuggestion(null);
        
        toast({
          title: "Motivator created!",
          description: "Your new motivator has been added to your collection"
        });
        
        // Close the modal after a short delay
        setTimeout(() => {
          onClose();
        }, 2000);
        
      } catch (error) {
        console.error('Error creating motivator:', error);
        toast({
          title: "Error",
          description: "Failed to create motivator. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleEditMotivator = () => {
    if (lastMotivatorSuggestion) {
      const currentArgs = lastMotivatorSuggestion.arguments;
      // Send a message to AI asking for edits
      handleSendMessage(`I want to edit this motivator. Current title: "${currentArgs?.title}" and content: "${currentArgs?.content}". Please help me modify it.`);
    }
  };

  // Handle bulk motivator functions
  const handleInlineMotivatorEdit = (motivatorIndex: number) => {
    if (lastMotivatorsSuggestion?.motivators && lastMotivatorsSuggestion.motivators[motivatorIndex]) {
      const motivator = lastMotivatorsSuggestion.motivators[motivatorIndex];
      setInlineMotivatorEditData(prev => ({
        ...prev,
        [motivatorIndex]: {
          title: motivator.title || '',
          content: motivator.content || '',
          category: motivator.category || ''
        }
      }));
      setEditingMotivatorIndex(motivatorIndex);
    }
  };

  const handleSaveInlineMotivatorEdit = (motivatorIndex: number) => {
    const editData = inlineMotivatorEditData[motivatorIndex];
    if (editData && lastMotivatorsSuggestion?.motivators) {
      // Update the motivator data in the lastMotivatorsSuggestion
      const updatedMotivators = [...lastMotivatorsSuggestion.motivators];
      updatedMotivators[motivatorIndex] = {
        ...updatedMotivators[motivatorIndex],
        title: editData.title,
        content: editData.content,
        category: editData.category || updatedMotivators[motivatorIndex].category
      };
      
      // Update the lastMotivatorsSuggestion with new data
      setLastMotivatorsSuggestion(prev => ({
        ...prev,
        motivators: updatedMotivators
      }));
      
      // Clear editing state
      setEditingMotivatorIndex(null);
      setInlineMotivatorEditData(prev => {
        const updated = { ...prev };
        delete updated[motivatorIndex];
        return updated;
      });
    }
  };

  const handleCancelInlineMotivatorEdit = (motivatorIndex: number) => {
    setEditingMotivatorIndex(null);
    setInlineMotivatorEditData(prev => {
      const updated = { ...prev };
      delete updated[motivatorIndex];
      return updated;
    });
  };

  const handleRemoveMotivator = (motivatorIndex: number) => {
    if (lastMotivatorsSuggestion?.motivators) {
      const updatedMotivators = lastMotivatorsSuggestion.motivators.filter((_, index) => index !== motivatorIndex);
      
      // Update the lastMotivatorsSuggestion with filtered motivators
      setLastMotivatorsSuggestion(prev => ({
        ...prev,
        motivators: updatedMotivators
      }));
      
      // Reset editing state if we were editing the removed item
      if (editingMotivatorIndex === motivatorIndex) {
        setEditingMotivatorIndex(null);
        setInlineMotivatorEditData(prev => {
          const updated = { ...prev };
          delete updated[motivatorIndex];
          return updated;
        });
      }
    }
  };

  const handleAddAllMotivators = async () => {
    if (lastMotivatorsSuggestion?.motivators && onResult) {
      // Show processing state
      setIsProcessing(true);
      
      try {
        // Call the result callback directly
        await onResult({
          name: 'create_multiple_motivators',
          arguments: { motivators: lastMotivatorsSuggestion.motivators }
        });
        
        // Add only the simple confirmation message
        const confirmationMessage: Message = {
          role: 'assistant',
          content: `✅ Created ${lastMotivatorsSuggestion.motivators.length} motivators successfully!`,
          timestamp: new Date()
        };
        
        addMessage(confirmationMessage);
        
        // Mark motivators as added but keep them visible
        setLastMotivatorsSuggestion(prev => ({
          ...prev,
          added: true
        }));
        
        // Close the modal after a short delay
        setTimeout(() => {
          onClose();
        }, 2000);
        
      } catch (error) {
        console.error('Error adding motivators:', error);
        toast({
          title: "Error",
          description: "Failed to create motivators. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Handle food search for editing
  const handleFoodSearch = async (searchTerm: string, context: 'today' | 'library' | 'templates') => {
    try {
      const results = await searchFoodsForEdit(searchTerm, context);
      
      if (results.length === 0) {
        const aiMessage: Message = {
          role: 'assistant',
          content: `I couldn't find any ${context === 'today' ? "today's entries" : context} matching "${searchTerm}". Try a different search term or check the specific location.`,
          timestamp: new Date()
        };
        addMessage(aiMessage);
        return;
      }

      // Show search results to user
      const resultsList = results.map(r => 
        `• ${r.name} (${r.type === 'today' ? 'Today' : r.type === 'library' ? 'Library' : 'Template'})`
      ).join('\n');
      
      const aiMessage: Message = {
        role: 'assistant',
        content: `Found ${results.length} food(s) matching "${searchTerm}":\n\n${resultsList}\n\nTell me what you'd like to change. For example: "Change the chicken to 150g" or "Update the banana calories to 120".`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
      
    } catch (error) {
      console.error('Error searching foods:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for foods. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle direct food editing with preview
  const handleDirectFoodEdit = async (itemId: string, updates: any, type: 'today' | 'library' | 'template') => {
    try {
      // Find the item being edited from previous search results
      const item = searchResults.find(r => r.id === itemId);
      if (!item) {
        throw new Error('Food item not found for editing');
      }

      // Create edit preview
      const preview = createEditPreview(item, updates);
      setActiveEditPreviews(prev => [...prev, preview]);

      // Show preview to user
      const changesList = Object.keys(updates).map(key => {
        const before = item.current_values[key as keyof typeof item.current_values];
        const after = updates[key];
        return `${key.replace('_', ' ')}: ${before} → ${after}`;
      }).join(', ');

      const aiMessage: Message = {
        role: 'assistant',
        content: `Ready to update ${item.name}: ${changesList}. Please confirm the changes below.`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
      
    } catch (error) {
      console.error('Error creating edit preview:', error);
      toast({
        title: "Edit Error",
        description: "Failed to prepare food edit. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Apply edit preview
  const handleApplyEditPreview = async (preview: any) => {
    try {
      await applyEditPreview(preview);
      
      // Remove from active previews
      setActiveEditPreviews(prev => prev.filter(p => p.id !== preview.id));
      
      // Add success message
      const aiMessage: Message = {
        role: 'assistant',
        content: `✅ Successfully updated ${preview.name}!`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
      
    } catch (error) {
      console.error('Error applying edit:', error);
    }
  };

  // Cancel edit preview
  const handleCancelEditPreview = (preview: any) => {
    setActiveEditPreviews(prev => prev.filter(p => p.id !== preview.id));
    
    const aiMessage: Message = {
      role: 'assistant',
      content: `Cancelled editing ${preview.name}.`,
      timestamp: new Date()
    };
    addMessage(aiMessage);
  };

  // Edit preview manually
  const handleEditPreviewManually = (preview: any) => {
    // This would open a modal or inline editor for manual editing
    // For now, just show a message
    const aiMessage: Message = {
      role: 'assistant',
      content: `Opening manual editor for ${preview.name}. Tell me what specific changes you'd like to make.`,
      timestamp: new Date()
    };
    addMessage(aiMessage);
  };

  // === SESSION MANAGEMENT HANDLERS ===
  const handleStartFastingSession = async (args: { goal_hours?: number }) => {
    try {
      const goalHours = args.goal_hours || 16;
      await startFastingSession(goalHours * 3600); // Convert to seconds
      
      const aiMessage: Message = {
        role: 'assistant',
        content: `✅ Started fasting! Your goal is ${goalHours} hours. I'll be here to support you throughout your journey.`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    } catch (error) {
      const aiMessage: Message = {
        role: 'assistant',
        content: `❌ Failed to start fasting session. ${(error as Error).message}`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    }
  };

  const handleStopFastingSession = async (args: { action: 'complete' | 'cancel' }) => {
    try {
      if (args.action === 'complete') {
        await endFastingSession();
      } else {
        await cancelFastingSession();
      }
      
      const aiMessage: Message = {
        role: 'assistant',
        content: args.action === 'complete' 
          ? `🎉 Congratulations on completing your fast! Well done!`
          : `Fast cancelled. No worries - you can start again whenever you're ready.`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    } catch (error) {
      const aiMessage: Message = {
        role: 'assistant',
        content: `❌ Failed to ${args.action} fasting session. ${(error as Error).message}`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    }
  };

  const handleStartWalkingSession = async (args: { speed_mph?: number }) => {
    try {
      const speed = args.speed_mph || profile?.default_walking_speed || 3;
      await startWalkingSession(speed);
      
      const aiMessage: Message = {
        role: 'assistant',
        content: `🚶‍♀️ Started walking at ${speed >= 4 ? 'fast' : 'normal'} pace! Enjoy your walk - I'll track your progress.`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    } catch (error) {
      const aiMessage: Message = {
        role: 'assistant',
        content: `❌ Failed to start walking session. ${(error as Error).message}`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    }
  };

  const handleStopWalkingSession = async () => {
    try {
      await endWalkingSession();
      
      const aiMessage: Message = {
        role: 'assistant',
        content: `🎉 Great walk! Session completed and calories have been logged.`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    } catch (error) {
      const aiMessage: Message = {
        role: 'assistant',
        content: `❌ Failed to end walking session. ${(error as Error).message}`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    }
  };

  // === STATUS QUERY HANDLERS ===
  const handleGetCurrentSessionStatus = async () => {
    let status = "";
    
    if (fastingSession) {
      const duration = Math.floor((Date.now() - new Date(fastingSession.start_time).getTime()) / (1000 * 60 * 60));
      status += `🕐 Currently fasting for ${duration} hours. `;
    }
    
    if (walkingSession) {
      const duration = Math.floor((Date.now() - new Date(walkingSession.start_time).getTime()) / (1000 * 60));
      status += `🚶‍♀️ Currently walking for ${duration} minutes. `;
    }
    
    if (!status) {
      status = "No active sessions right now. Ready to start when you are!";
    }
    
    const aiMessage: Message = {
      role: 'assistant',
      content: status,
      timestamp: new Date()
    };
    addMessage(aiMessage);
  };

  const handleGetCurrentFastDuration = async () => {
    if (!fastingSession) {
      const aiMessage: Message = {
        role: 'assistant',
        content: "You're not currently fasting. Ready to start when you are!",
        timestamp: new Date()
      };
      addMessage(aiMessage);
      return;
    }
    
    const duration = Math.floor((Date.now() - new Date(fastingSession.start_time).getTime()) / (1000 * 60 * 60));
    const hours = Math.floor(duration);
    const minutes = Math.floor((duration - hours) * 60);
    
    const aiMessage: Message = {
      role: 'assistant',
      content: `🕐 You've been fasting for ${hours} hours and ${minutes} minutes. Keep going strong!`,
      timestamp: new Date()
    };
    addMessage(aiMessage);
  };

  const handleGetCurrentWalkDuration = async () => {
    if (!walkingSession) {
      const aiMessage: Message = {
        role: 'assistant',
        content: "You're not currently walking. Ready for a walk?",
        timestamp: new Date()
      };
      addMessage(aiMessage);
      return;
    }
    
    const duration = Math.floor((Date.now() - new Date(walkingSession.start_time).getTime()) / (1000 * 60));
    
    const aiMessage: Message = {
      role: 'assistant',
      content: `🚶‍♀️ You've been walking for ${duration} minutes. Great job!`,
      timestamp: new Date()
    };
    addMessage(aiMessage);
  };

  const handleGetTodayDeficit = async () => {
    const deficit = deficitData?.todayDeficit || 0;
    const caloriesIn = deficitData?.caloriesConsumed || 0;
    const caloriesOut = deficitData?.totalCaloriesBurned || 0;
    
    const aiMessage: Message = {
      role: 'assistant',
      content: `📊 Today's progress: ${Math.abs(deficit)} calorie ${deficit >= 0 ? 'deficit' : 'surplus'}. You've consumed ${caloriesIn} calories and burned ${caloriesOut} calories.`,
      timestamp: new Date()
    };
    addMessage(aiMessage);
  };

  // === ADMIN HANDLERS ===
  const handleAddAdminPersonalLog = async (args: { hour: number; log_entry: string }) => {
    if (!isAdmin) {
      const aiMessage: Message = {
        role: 'assistant',
        content: "❌ Admin access required for personal logs.",
        timestamp: new Date()
      };
      addMessage(aiMessage);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('fasting_hours')
        .update({ admin_personal_log: args.log_entry })
        .eq('hour', args.hour);
      
      if (error) throw error;
      
      const aiMessage: Message = {
        role: 'assistant',
        content: `✅ Added personal log for hour ${args.hour}.`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    } catch (error) {
      const aiMessage: Message = {
        role: 'assistant',
        content: `❌ Failed to add personal log. ${(error as Error).message}`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    }
  };

  const handleGetAdminPersonalLog = async (args: { hour?: number }) => {
    if (!isAdmin) {
      const aiMessage: Message = {
        role: 'assistant',
        content: "❌ Admin access required for personal logs.",
        timestamp: new Date()
      };
      addMessage(aiMessage);
      return;
    }
    
    try {
      let query = supabase
        .from('fasting_hours')
        .select('hour, admin_personal_log')
        .not('admin_personal_log', 'is', null);
      
      if (args.hour) {
        query = query.eq('hour', args.hour);
      }
      
      const { data, error } = await query.order('hour');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        const aiMessage: Message = {
          role: 'assistant',
          content: args.hour 
            ? `No personal log found for hour ${args.hour}.`
            : "No personal logs found.",
          timestamp: new Date()
        };
        addMessage(aiMessage);
        return;
      }
      
      const logs = data.map(d => `Hour ${d.hour}: ${d.admin_personal_log}`).join('\n\n');
      
      const aiMessage: Message = {
        role: 'assistant',
        content: logs,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    } catch (error) {
      const aiMessage: Message = {
        role: 'assistant',
        content: `❌ Failed to get personal logs. ${(error as Error).message}`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    }
  };

  // === PROFILE UPDATE HANDLERS ===
  const handleUpdateWeight = async (args: { weight_kg: number }) => {
    try {
      await updateProfile({ weight: args.weight_kg });
      
      const aiMessage: Message = {
        role: 'assistant',
        content: `✅ Updated your weight to ${args.weight_kg} kg.`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    } catch (error) {
      const aiMessage: Message = {
        role: 'assistant',
        content: `❌ Failed to update weight. ${(error as Error).message}`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    }
  };

  const handleUpdateGoalWeight = async (args: { goal_weight_kg: number }) => {
    try {
      await updateProfile({ goal_weight: args.goal_weight_kg });
      
      const aiMessage: Message = {
        role: 'assistant',
        content: `✅ Updated your goal weight to ${args.goal_weight_kg} kg.`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    } catch (error) {
      const aiMessage: Message = {
        role: 'assistant',
        content: `❌ Failed to update goal weight. ${(error as Error).message}`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    }
  };

  const handleUpdateDailyGoals = async (args: { daily_calorie_goal?: number; daily_carb_goal?: number }) => {
    try {
      const updates: any = {};
      if (args.daily_calorie_goal) updates.daily_calorie_goal = args.daily_calorie_goal;
      if (args.daily_carb_goal) updates.daily_carb_goal = args.daily_carb_goal;
      
      await updateProfile(updates);
      
      const messages = [];
      if (args.daily_calorie_goal) messages.push(`calories to ${args.daily_calorie_goal}`);
      if (args.daily_carb_goal) messages.push(`carbs to ${args.daily_carb_goal}g`);
      
      const aiMessage: Message = {
        role: 'assistant',
        content: `✅ Updated your daily goals: ${messages.join(', ')}.`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    } catch (error) {
      const aiMessage: Message = {
        role: 'assistant',
        content: `❌ Failed to update daily goals. ${(error as Error).message}`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    }
  };

  const handleGetWeightLossProjection = async () => {
    if (!profile?.weight || !profile?.goal_weight) {
      const aiMessage: Message = {
        role: 'assistant',
        content: "Please set your current weight and goal weight first to get projections.",
        timestamp: new Date()
      };
      addMessage(aiMessage);
      return;
    }
    
    try {
      const weightToLose = profile.weight - profile.goal_weight;
      const fatGrams = weightToLose * 1000 * 0.85; // Estimate: 85% of weight loss is fat
      const currentDeficit = deficitData?.todayDeficit || 500;
      const daysToGoal = Math.ceil(fatGrams / currentDeficit);
      
      const aiMessage: Message = {
        role: 'assistant',
        content: `📈 Weight loss projection: You need to lose ${weightToLose.toFixed(1)} kg (${fatGrams.toFixed(0)}g of fat). At your current deficit rate of ${currentDeficit} calories/day, you'll reach your goal in approximately ${daysToGoal} days.`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    } catch (error) {
      const aiMessage: Message = {
        role: 'assistant',
        content: `❌ Failed to calculate projection. ${(error as Error).message}`,
        timestamp: new Date()
      };
      addMessage(aiMessage);
    }
  };

  // Helper function to check if message contains food suggestion
  const containsFoodSuggestion = (content: string) => {
    const foodKeywords = ['calories', 'carbs', 'grams', 'add this', 'add it', 'food log'];
    const hasKeywords = foodKeywords.some(keyword => content.toLowerCase().includes(keyword));
    const isQuestion = content.includes('?');
    const seemsLikeFood = /\d+\s*(calories|cal|grams?|g\b)/i.test(content);
    
    return hasKeywords && !content.toLowerCase().includes('what food') && (seemsLikeFood || content.toLowerCase().includes('add'));
  };

  // Helper function to check if message contains motivator suggestion
  const containsMotivatorSuggestion = (content: string) => {
    const motivatorKeywords = ['title:', 'content:', 'motivator', 'suggestion ready'];
    const hasKeywords = motivatorKeywords.some(keyword => content.toLowerCase().includes(keyword));
    const hasStructure = content.includes('Title:') || content.includes('Content:') || content.includes('**Title');
    const isGreeting = content.toLowerCase().includes('hello') || content.toLowerCase().includes('welcome') || content.toLowerCase().includes('help you create');
    
    return (hasKeywords || hasStructure) && !isGreeting;
  };

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant="standard"
      size="sm"
      showCloseButton={true}
    >
      {/* Messages with better spacing and scrolling */}
      <div className="relative">
        <div 
          className="space-y-6 min-h-[300px] max-h-[400px] overflow-y-auto mb-4" 
          onScroll={handleScroll}
        >
        {/* Emergency fallback - if modal is open but no messages, show error message */}
        {isOpen && messages.length === 0 && (
          <div className="flex justify-start">
            <Card className="max-w-[85%] p-3 bg-muted">
              <div className="text-sm whitespace-pre-line text-destructive">
                ⚠️ System Error: No messages loaded. Please try closing and reopening the chat.
                
                Debug info:
                - Modal open: {isOpen ? 'Yes' : 'No'}
                - Initialized: {isInitialized ? 'Yes' : 'No'}
                - Messages count: {messages.length}
              </div>
            </Card>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card className={`max-w-[85%] p-3 ${
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  
                   
                  {/* AI Response with streaming indicator */}

                  {/* Voice correction button for follow-up messages */}
                  {message.role === 'assistant' && message.content.includes('Need to make adjustments?') && (
                    <div className="flex justify-center mt-3">
                      <PremiumGate feature="Voice Input" grayOutForFree={true}>
                        <CircularVoiceButton
                          onTranscription={handleVoiceTranscription}
                          isDisabled={isProcessing}
                          size="sm"
                        />
                      </PremiumGate>
                    </div>
                  )}
                
                    {/* Motivator suggestion buttons */}
                    {conversationType === 'general' && title === 'Motivator Assistant' && message.role === 'assistant' && lastMotivatorSuggestion && (
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          onClick={handleCreateMotivator}
                          className="text-xs bg-primary text-primary-foreground"
                        >
                          Create This Motivator
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingMotivator(true);
                            // Scroll to edit form after it renders
                            setTimeout(() => {
                              editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }, 100);
                          }}
                          className="text-xs"
                        >
                          Edit Language
                        </Button>
                      </div>
                     )}

                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ))}

        {/* Inline motivator editing - positioned OUTSIDE messages loop */}
        {editingMotivator && lastMotivatorSuggestion && (
          <div ref={editFormRef} className="mt-4 p-4 border-2 border-primary/50 rounded-lg bg-primary/5">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Edit Your Motivator</h4>
              <div>
                <Label htmlFor="motivator-title" className="text-sm font-medium">Goal Title</Label>
                <Input
                  id="motivator-title"
                  value={motivatorEditData.title || lastMotivatorSuggestion.arguments.title}
                  onChange={(e) => setMotivatorEditData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                  placeholder="Enter motivating title"
                />
              </div>
              <div>
                <Label htmlFor="motivator-content" className="text-sm font-medium">Goal Description</Label>
                <textarea
                  id="motivator-content"
                  value={motivatorEditData.content || lastMotivatorSuggestion.arguments.content}
                  onChange={(e) => setMotivatorEditData(prev => ({ ...prev, content: e.target.value }))}
                  className="mt-1 w-full p-2 border border-input rounded-md resize-none h-20 text-sm"
                  placeholder="Describe your motivating goal"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    // Update the motivator suggestion with edited data
                    const updatedTitle = motivatorEditData.title || lastMotivatorSuggestion.arguments.title;
                    const updatedContent = motivatorEditData.content || lastMotivatorSuggestion.arguments.content;
                    
                    const updatedArgs = {
                      ...lastMotivatorSuggestion.arguments,
                      title: updatedTitle,
                      content: updatedContent
                    };
                    
                    setLastMotivatorSuggestion(prev => ({
                      ...prev,
                      arguments: updatedArgs
                    }));
                    
                    // For the complex message update, we need to implement this differently
                    // since we can't directly update message history with addMessage
                    // We'll add a new updated message instead
                    const updatedMessage: Message = {
                      role: 'assistant',
                      content: `Updated motivator:\n\n${updatedTitle}\n\n${updatedContent}`,
                      timestamp: new Date()
                    };
                    addMessage(updatedMessage);
                    
                    setEditingMotivator(false);
                    setMotivatorEditData({title: '', content: ''});
                    
                    toast({
                      title: "Changes saved",
                      description: "Your motivator has been updated"
                    });
                  }}
                  className="flex-1"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingMotivator(false);
                    setMotivatorEditData({title: '', content: ''});
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Display active edit previews */}
        {activeEditPreviews.length > 0 && (
          <div className="space-y-2">
            {activeEditPreviews.map((preview, index) => (
              <FoodEditPreview
                key={`${preview.id}-${index}`}
                preview={preview}
                onConfirm={() => handleApplyEditPreview(preview)}
                onCancel={() => handleCancelEditPreview(preview)}
                onEdit={() => handleEditPreviewManually(preview)}
              />
            ))}
          </div>
        )}

        {/* Bulk motivators display */}
        {lastMotivatorsSuggestion?.motivators && lastMotivatorsSuggestion.motivators.length > 0 && (
          <div className="space-y-2">
            {/* Summary header */}
            <Card className="p-3 bg-muted/50">
              <div className="text-sm font-medium">
                {lastMotivatorsSuggestion.motivators.length} Motivators Ready
                {lastMotivatorsSuggestion.added && (
                  <span className="ml-2 text-green-600 text-xs">✅ Created successfully</span>
                )}
              </div>
            </Card>
            
            {lastMotivatorsSuggestion.motivators.map((motivator: any, index: number) => (
              <Card key={index} className="p-3 bg-background border">
                {editingMotivatorIndex === index ? (
                  // Inline editing mode
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Title</div>
                      <Input
                        value={inlineMotivatorEditData[index]?.title || ''}
                        onChange={(e) => setInlineMotivatorEditData(prev => ({
                          ...prev,
                          [index]: { ...prev[index], title: e.target.value }
                        }))}
                        placeholder="Motivator title"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Content</div>
                      <textarea
                        value={inlineMotivatorEditData[index]?.content || ''}
                        onChange={(e) => setInlineMotivatorEditData(prev => ({
                          ...prev,
                          [index]: { ...prev[index], content: e.target.value }
                        }))}
                        placeholder="Motivational content"
                        className="w-full p-2 border border-input rounded-md resize-none h-16 text-sm"
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleSaveInlineMotivatorEdit(index)}
                        className="h-8 px-3 text-sm flex-1"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelInlineMotivatorEdit(index)}
                        className="h-8 px-3 text-sm flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{motivator.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {motivator.content}
                      </div>
                      {motivator.category && (
                        <div className="text-xs text-primary mt-1 font-medium">
                          #{motivator.category}
                        </div>
                      )}
                    </div>
                    {!lastMotivatorsSuggestion.added && (
                      <div className="flex gap-1 ml-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleInlineMotivatorEdit(index)}
                          className="h-8 px-3 text-sm"
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleRemoveMotivator(index)}
                          className="h-8 px-3 text-sm text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
            
            {/* Add All Motivators button - only show if not added yet */}
            {!lastMotivatorsSuggestion.added && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleAddAllMotivators}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Creating...' : `Create All ${lastMotivatorsSuggestion.motivators.length} Motivators`}
                </Button>
              </div>
            )}
          </div>
        )}

        {lastFoodSuggestion?.foods && lastFoodSuggestion.foods.length > 0 && (
          <div className="space-y-2">
            {/* Total summary - compact single line */}
            <Card ref={calorieSummaryRef} className="p-3 bg-muted/50">
              <div className="text-sm font-medium">
                Selected: {Array.from(selectedFoodIds).reduce((sum: number, index) => {
                  const food = lastFoodSuggestion.foods[index];
                  return sum + (food?.calories || 0);
                }, 0)} calories, {Math.round(Array.from(selectedFoodIds).reduce((sum: number, index) => {
                  const food = lastFoodSuggestion.foods[index];
                  return sum + (food?.carbs || 0);
                }, 0))}g carbs
                {lastFoodSuggestion.added && (
                  <span className="ml-2 text-green-600 text-xs">✅ Added to log</span>
                )}
              </div>
            </Card>
            
            {lastFoodSuggestion.foods.map((food: any, index: number) => (
              <Card key={index} className="p-3 bg-background border">
                {editingFoodIndex === index ? (
                  // Inline editing mode
                  <div className="space-y-2">
                    <Input
                      value={inlineEditData[index]?.name || ''}
                      onChange={(e) => setInlineEditData(prev => ({
                        ...prev,
                        [index]: { ...prev[index], name: e.target.value }
                      }))}
                      placeholder="Food name"
                      className="h-8 text-sm"
                    />
                    <div className="grid grid-cols-3 gap-1">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Weight (g)</div>
                        <Input
                          type="number"
                          value={inlineEditData[index]?.portion || ''}
                          onChange={(e) => setInlineEditData(prev => ({
                            ...prev,
                            [index]: { ...prev[index], portion: e.target.value }
                          }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Calories</div>
                        <Input
                          type="number"
                          value={inlineEditData[index]?.calories || ''}
                          onChange={(e) => setInlineEditData(prev => ({
                            ...prev,
                            [index]: { ...prev[index], calories: e.target.value }
                          }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Carbs (g)</div>
                        <Input
                          type="number"
                          value={inlineEditData[index]?.carbs || ''}
                          onChange={(e) => setInlineEditData(prev => ({
                            ...prev,
                            [index]: { ...prev[index], carbs: e.target.value }
                          }))}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleSaveInlineEdit(index)}
                        className="h-8 px-3 text-sm flex-1"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelInlineEdit(index)}
                        className="h-8 px-3 text-sm flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex items-center gap-2">
                    {!lastFoodSuggestion.added && (
                      <Checkbox
                        checked={selectedFoodIds.has(index)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedFoodIds);
                          if (checked) {
                            newSelected.add(index);
                          } else {
                            newSelected.delete(index);
                          }
                          setSelectedFoodIds(newSelected);
                        }}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{food.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {food.serving_size}g • {food.calories} cal • {Math.round(food.carbs)}g carbs
                      </div>
                    </div>
                    {!lastFoodSuggestion.added && (
                      <div className="flex gap-1 shrink-0">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleInlineEdit(index)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleRemoveFood(index)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
            
            {/* Sticky action bar with divider */}
            {!lastFoodSuggestion.added && (
              <div className="sticky bottom-0 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-t pt-3 pb-2 px-1 mt-3">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs text-muted-foreground">Add to</span>
                  <div className="flex gap-1">
                    {(['today','template','library'] as const).map(dest => (
                      <Button
                        key={dest}
                        size="sm"
                        variant={ (lastFoodSuggestion.destination || 'today') === dest ? 'default' : 'outline' }
                        className="h-7 px-2 text-xs"
                        onClick={() => setLastFoodSuggestion((prev:any) => ({...prev, destination: dest}))}
                      >
                        {dest.charAt(0).toUpperCase() + dest.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddAllFoods}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={isProcessing || selectedFoodIds.size === 0}
                >
                  {isProcessing ? 'Adding...' : `Add ${selectedFoodIds.size} Selected Food${selectedFoodIds.size !== 1 ? 's' : ''}`}
                </Button>
              </div>
            )}
          </div>
        )}
        
        {isProcessing && (
          <div className="flex justify-start">
            <Card className="max-w-[85%] p-3 bg-muted">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <p className="text-sm">AI is thinking...</p>
              </div>
            </Card>
          </div>
        )}
        
          <div ref={messagesEndRef} className="h-4" />
        </div>
        
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <Button
            onClick={scrollToBottom}
            size="sm"
            variant="secondary"
            className="absolute bottom-2 right-2 rounded-full h-8 w-8 p-0 shadow-lg"
          >
            ↓
          </Button>
        )}
      </div>

      {/* Voice Input Only - Text input removed per user request */}
      {editingFoodIndex === null && (
        <div className="border-t border-border pt-4 mt-4 space-y-3">
          {/* Voice Recording */}
          <div className="w-full flex justify-center">
            <PremiumGate feature="Voice Input" grayOutForFree={true}>
              <CircularVoiceButton
                ref={voiceButtonRef}
                onTranscription={handleVoiceTranscription}
                isDisabled={isProcessing}
                size="lg"
                autoStart={true}
              />
            </PremiumGate>
          </div>
        </div>
      )}
    </UniversalModal>
  );
};
