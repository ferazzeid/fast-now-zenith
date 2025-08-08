import { useState, useEffect, useRef } from 'react';
import { Send, X, Edit, Mic } from 'lucide-react';
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
  quickReplies = []
}: ModalAiChatProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [lastFoodSuggestion, setLastFoodSuggestion] = useState<any>(null);
  const [lastMotivatorSuggestion, setLastMotivatorSuggestion] = useState<any>(null);
  const [lastMotivatorsSuggestion, setLastMotivatorsSuggestion] = useState<any>(null);
  const [editingFoodIndex, setEditingFoodIndex] = useState<number | null>(null);
  const [editingMotivatorIndex, setEditingMotivatorIndex] = useState<number | null>(null);
  const [editingMotivator, setEditingMotivator] = useState(false);
  const [motivatorEditData, setMotivatorEditData] = useState<{title: string, content: string}>({title: '', content: ''});
  const [inlineEditData, setInlineEditData] = useState<{[key: number]: any}>({});
  const [inlineMotivatorEditData, setInlineMotivatorEditData] = useState<{[key: number]: any}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  // const { toast } = useToast(); // Already imported directly
  const { user } = useAuth();
  const {
    searchResults,
    searchFoodsForEdit,
    createEditPreview,
    applyEditPreview
  } = useFoodEditingActions();
  const [activeEditPreviews, setActiveEditPreviews] = useState<any[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      // Initialize messages array
      const initialMessages: Message[] = [];
      
      // Add context message if provided
      if (context) {
        const contextMessage: Message = {
          role: 'assistant',
          content: context,
          timestamp: new Date()
        };
        initialMessages.push(contextMessage);
      }
      
      
      setMessages(initialMessages);
      setLastFoodSuggestion(null);
      setLastMotivatorSuggestion(null);
      setLastMotivatorsSuggestion(null);
    } else if (!isOpen) {
      // Clear messages when modal closes - but only after a small delay to prevent flickering
      setTimeout(() => {
        setMessages([]);
        setEditingFoodIndex(null);
        setEditingMotivatorIndex(null);
        setEditingMotivator(false);
        setMotivatorEditData({title: '', content: ''});
        setInlineEditData({});
        setInlineMotivatorEditData({});
        setLastFoodSuggestion(null);
        setLastMotivatorSuggestion(null);
        setLastMotivatorsSuggestion(null);
      }, 100);
    }
  }, [isOpen, context, conversationType, proactiveMessage]);

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

**FOR ADDING FOODS:**
1. IMMEDIATELY process food information and call add_multiple_foods function
2. ONLY respond with clean, minimal format: "Food Name (Amount) - Calories cal, Carbs g carbs" for each item
3. Use reasonable portion sizes (150g apple, 100g chicken breast, 60g bread slice, etc.)
4. Always call add_multiple_foods function immediately when processing food input

**FOR EDITING FOODS:**
1. When users want to edit/change/update/fix foods, FIRST call search_foods_for_edit to find the food
2. Use context clues to determine search location:
   - "today's food", "my lunch", "the chicken I ate" → context: "today"
   - "in my library", "my saved foods" → context: "library" 
   - "my template", "daily template" → context: "templates"
3. After finding foods, if user specifies exact changes, call edit_food_entry or edit_library_food
4. Be smart about matching: "the chicken" should find recent chicken entries, "my banana" finds banana entries

**EDITING EXAMPLES:**
- "Change my lunch chicken to 150g" → search_foods_for_edit("chicken", "today") then edit_food_entry
- "Update the banana calories to 120" → search_foods_for_edit("banana", "today") then edit_food_entry  
- "Fix my salmon library entry, should be 250 calories per 100g" → search_foods_for_edit("salmon", "library") then edit_library_food

**RESPONSE FORMAT FOR ADDING:**
- Ham (200g) - 240 cal, 2g carbs
- Mozzarella (125g) - 315 cal, 1.5g carbs
Total: 555 calories, 3.5g carbs

**RESPONSE FORMAT FOR EDITING:**
Always call the appropriate function first, then provide confirmation.

CRITICAL: Always use function calls for food operations. NO manual text responses for food data.`;
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

**CRITICAL RULES:**
- ALWAYS call the appropriate function immediately - no questions or discussions
- For multiple goals, ALWAYS use create_multiple_motivators, not individual create_motivator calls
- Create the motivators directly based on what they told you
- Each motivator should be distinct and focused on one specific goal`;
      }

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: { 
          messages: [
            { role: 'system', content: enhancedSystemPrompt },
            ...conversationHistory,
            { role: 'user', content: message }
          ]
        }
      });

      if (error) throw error;

      console.log('🤖 AI Response received:', { data, completion: data?.completion, functionCall: data?.functionCall });

      // Handle function calls for food and motivator suggestions
      if (data.functionCall) {
        if (data.functionCall.name === 'add_multiple_foods') {
          setLastFoodSuggestion(data.functionCall.arguments);
          // Don't add any AI message for food suggestions - just show the interactive UI
          return;
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
          setMessages(prev => [...prev, motivatorMessage]);
          return;
        } else if (data.functionCall.name === 'search_foods_for_edit') {
          // Handle food search for editing
          const { search_term, context } = data.functionCall.arguments;
          await handleFoodSearch(search_term, context);
          return;
        } else if (data.functionCall.name === 'edit_food_entry') {
          // Handle direct food entry editing
          const { entry_id, updates } = data.functionCall.arguments;
          await handleDirectFoodEdit(entry_id, updates, 'today');
          return;
        } else if (data.functionCall.name === 'edit_library_food') {
          // Handle library food editing
          const { food_id, updates } = data.functionCall.arguments;
          await handleDirectFoodEdit(food_id, updates, 'library');
          return;
        }
      }

      // Only add completion text if it exists and doesn't contain food suggestions
      if (data.completion && data.completion.trim() && !containsFoodSuggestion(data.completion)) {
        const aiMessage: Message = {
          role: 'assistant',
          content: data.completion,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
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
    setMessages(prev => [...prev, userMessage]);
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

    setMessages(prev => [...prev, userMessage]);

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
  };

  const handleRemoveFood = (foodIndex: number) => {
    if (lastFoodSuggestion?.foods) {
      const updatedFoods = lastFoodSuggestion.foods.filter((_, index) => index !== foodIndex);
      
      // Update the lastFoodSuggestion with filtered foods
      setLastFoodSuggestion(prev => ({
        ...prev,
        foods: updatedFoods
      }));
      
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
    if (lastFoodSuggestion?.foods && onResult) {
      // Show processing state
      setIsProcessing(true);
      
      try {
        // Call the result callback directly without showing user message
        await onResult({
          name: 'add_multiple_foods',
          arguments: { foods: lastFoodSuggestion.foods }
        });
        
        // Add only the simple confirmation message
        const confirmationMessage: Message = {
          role: 'assistant',
          content: '✅ Foods added successfully!',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, confirmationMessage]);
        
        // Mark foods as added but keep them visible
        setLastFoodSuggestion(prev => ({
          ...prev,
          added: true
        }));
        
      } catch (error) {
        console.error('Error adding foods:', error);
      } finally {
        setIsProcessing(false);
      }
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
        setMessages(prev => [...prev, successMessage]);
        
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
        
        setMessages(prev => [...prev, confirmationMessage]);
        
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
        setMessages(prev => [...prev, aiMessage]);
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
      setMessages(prev => [...prev, aiMessage]);
      
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
      setMessages(prev => [...prev, aiMessage]);
      
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
      setMessages(prev => [...prev, aiMessage]);
      
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
    setMessages(prev => [...prev, aiMessage]);
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
    setMessages(prev => [...prev, aiMessage]);
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
      <div className="space-y-4 min-h-[300px] max-h-[400px] overflow-y-auto mb-4">
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
                    
                    // Update ALL motivator messages in the chat with the new content
                    setMessages(prev => prev.map(msg => {
                      // Find motivator messages that match the current suggestion content
                      if (msg.role === 'assistant' && 
                          msg.content.includes(lastMotivatorSuggestion.arguments.title) &&
                          msg.content.includes(lastMotivatorSuggestion.arguments.content)) {
                        return {
                          ...msg,
                          content: `${updatedTitle}

${updatedContent}`
                        };
                      }
                      return msg;
                    }));
                    
                    setEditingMotivator(false);
                    setMotivatorEditData({title: '', content: ''});
                    
                    toast({
                      title: "Changes saved",
                      description: "Your motivator has been updated"
                    });
                  }}
                  className="flex-1"
                >
                  Save Changes
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
            {/* Total summary */}
            <Card className="p-3 bg-muted/50">
              <div className="text-sm font-medium">
                Total: {lastFoodSuggestion.foods.reduce((sum: number, food: any) => sum + (food.calories || 0), 0)} calories, {lastFoodSuggestion.foods.reduce((sum: number, food: any) => sum + (food.carbs || 0), 0)}g carbs
                {lastFoodSuggestion.added && (
                  <span className="ml-2 text-green-600 text-xs">✅ Added to log</span>
                )}
              </div>
            </Card>
            
            {lastFoodSuggestion.foods.map((food: any, index: number) => (
              <Card key={index} className="p-3 bg-background border">
                {editingFoodIndex === index ? (
                  // Inline editing mode
                  <div className="space-y-2">{/* ... rest of inline editing JSX ... */}
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
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{food.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {food.serving_size}g • {food.calories} cal • {food.carbs}g carbs
                      </div>
                    </div>
                    {!lastFoodSuggestion.added && (
                      <div className="flex gap-1 ml-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleInlineEdit(index)}
                          className="h-8 px-3 text-sm"
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleRemoveFood(index)}
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
            
            {/* Add All Foods button - only show if not added yet */}
            {!lastFoodSuggestion.added && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleAddAllFoods}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Adding...' : 'Add All Foods'}
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
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {editingFoodIndex === null && (
        <div className="border-t border-border pt-4 mt-4 space-y-3">
          {/* Text Input */}
          <div className="flex gap-2 items-end">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={title === "Motivator Assistant" ? "What motivates you? For example..." : "Ask about food details..."}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={isProcessing}
              className="flex-1"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isProcessing}
              size="default"
              className="flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
        {/* Voice Recording */}
        <div className="w-full flex justify-center">
          <PremiumGate feature="Voice Input" grayOutForFree={true}>
            <CircularVoiceButton
              onTranscription={handleVoiceTranscription}
              isDisabled={isProcessing}
              size="lg"
            />
          </PremiumGate>
        </div>
      </div>
      )}
    </UniversalModal>
  );
};