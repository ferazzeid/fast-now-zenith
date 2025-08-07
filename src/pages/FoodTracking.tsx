import { useState } from 'react';
import { Plus, Save, History, Edit, Trash2, X, Mic, Info, Footprints, ChevronDown, ChevronUp, Utensils, MoreVertical, Check, Camera } from 'lucide-react';
import { convertToGrams } from '@/utils/foodConversions';
import { PageOnboardingButton } from '@/components/PageOnboardingButton';
import { HistoryButton } from '@/components/HistoryButton';
import { PageOnboardingModal } from '@/components/PageOnboardingModal';
import { onboardingContent } from '@/data/onboardingContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FoodLibraryView } from '@/components/FoodLibraryView';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UniversalModal } from '@/components/ui/universal-modal';
import { FoodHistory } from '@/components/FoodHistory';
import { EditFoodEntryForm } from '@/components/EditFoodEntryForm';
import { ModalAiChat } from '@/components/ModalAiChat';
import { ManualFoodEntry } from '@/components/ManualFoodEntry';
import { PremiumGate } from '@/components/PremiumGate';
import { ComponentErrorBoundary } from '@/components/ErrorBoundary';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ClickableTooltip } from '@/components/ClickableTooltip';
import { useToast } from '@/hooks/use-toast';
import { useFoodEntriesQuery } from '@/hooks/optimized/useFoodEntriesQuery';
import { useFoodWalkingCalculation } from '@/hooks/useFoodWalkingCalculation';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { trackFoodEvent, trackAIEvent } from '@/utils/analytics';
import { useDailyFoodTemplate } from '@/hooks/useDailyFoodTemplate';
import { FoodPlanSummary } from '@/components/FoodPlanSummary';

const FoodTracking = () => {
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [imageUrl, setImageUrl] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [consumedNow, setConsumedNow] = useState(true);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  
  const [showLibraryView, setShowLibraryView] = useState(false);
  // Remove tab state - using unified view now
  const [showAiChat, setShowAiChat] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [manualEntryData, setManualEntryData] = useState({
    name: '',
    servingSize: '',
    servingUnit: 'grams',
    calories: '',
    carbs: ''
  });
  const [aiChatContext, setAiChatContext] = useState('');
  
  // New state for daily food plan system
  const [activeTab, setActiveTab] = useState('today');
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { addFoodEntry, updateFoodEntry, deleteFoodEntry, toggleConsumption, todayEntries, todayTotals, refreshFoodEntries } = useFoodEntriesQuery();
  const { calculateWalkingMinutesForFood, formatWalkingTime } = useFoodWalkingCalculation();
  const { templateFoods, saveAsTemplate: saveTemplate, clearTemplate, applyTemplate, loadTemplate, loading: templateLoading } = useDailyFoodTemplate();

  const handleVoiceFood = async () => {
    trackAIEvent('chat', 'food_assistant');
    
    // Load admin-configured prompts and user preferences
    const unitLabel = profile?.units === 'metric' ? 'grams' : 'ounces';
    const unitExample = profile?.units === 'metric' ? '150 grams' : '5 ounces';
    
    let systemPrompt = `To add food items, I'll need:
1. Food name
2. Portion size in ${unitLabel}
3. Calories (I can estimate)
4. Carbs in grams (I can estimate)`;
    
    const aiChatContext = systemPrompt;

    let philosophyContext = '';

    try {
      // Load system prompt
      const { data: systemData } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'ai_food_assistant_system_prompt')
        .single();
      
      if (systemData?.setting_value) {
        systemPrompt = systemData.setting_value.replace('{units}', profile?.units || 'metric').replace('{unit_label}', unitLabel).replace('{unit_example}', unitExample);
      }

      // Load program philosophy
      const { data: philosophyData } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'ai_program_philosophy_prompt')
        .single();
      
      if (philosophyData?.setting_value) {
        philosophyContext = `\n\nProgram Philosophy: ${philosophyData.setting_value}`;
      }
    } catch (error) {
      console.log('Using default prompts');
    }

    setShowAiChat(true);
    setAiChatContext(aiChatContext);
  };

  const handleAiChatResult = async (result: any) => {
    if (result.name === 'add_food_entry') {
      const { arguments: args } = result;
      
      // Add the food entry from AI suggestion
      const foodResult = await addFoodEntry({
        name: args.name,
        calories: parseFloat(args.calories),
        carbs: parseFloat(args.carbs),
        serving_size: parseFloat(args.serving_size),
        consumed: args.consumed || false
      });

      if (!foodResult || 'error' in foodResult) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to add food entry"
        });
      } else {
        trackFoodEvent('add', 'voice');
        
        // Show detailed confirmation message with better visibility
        toast({
          title: "✅ Food Added Successfully!",
          description: `${args.name} (${args.serving_size}g) added to your food plan with ${args.calories} cal and ${args.carbs}g carbs. Check your food list below or continue adding more items.`
        });
        
        // Save to personal library
        await saveToLibrary({
          name: args.name,
          calories: parseFloat(args.calories),
          carbs: parseFloat(args.carbs),
          serving_size: parseFloat(args.serving_size)
        });
      }
    } else if (result.name === 'add_multiple_foods') {
      const { arguments: args } = result;
      const foods = args.foods || [];
      
      let successCount = 0;
      let totalCalories = 0;
      let totalCarbs = 0;
      
      // Add all foods sequentially
      for (const food of foods) {
        const foodResult = await addFoodEntry({
          name: food.name,
          calories: parseFloat(food.calories),
          carbs: parseFloat(food.carbs),
          serving_size: parseFloat(food.serving_size),
          consumed: food.consumed || false
        });

        if (foodResult && !('error' in foodResult)) {
          successCount++;
          totalCalories += parseFloat(food.calories);
          totalCarbs += parseFloat(food.carbs);
          
          // Save each to personal library
          await saveToLibrary({
            name: food.name,
            calories: parseFloat(food.calories),
            carbs: parseFloat(food.carbs),
            serving_size: parseFloat(food.serving_size)
          });
        }
      }
      
      if (successCount > 0) {
        trackFoodEvent('add', 'voice');
        toast({
          title: "✅ Foods Added Successfully!",
          description: `${successCount} food items added with ${Math.round(totalCalories)} total calories and ${Math.round(totalCarbs)}g carbs. Check your food list below!`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to add food items. Please try again."
        });
      }
    }
  };

  const handleManualEntry = () => {
    trackFoodEvent('add', 'manual');
    setManualEntryData({
      name: '',
      servingSize: '',
      servingUnit: 'grams',
      calories: '',
      carbs: ''
    });
    setShowManualEntry(true);
  };


  const handleSaveManualEntry = async () => {
    if (!manualEntryData.name.trim() || !manualEntryData.servingSize.trim()) {
      toast({
        variant: "destructive",
        title: "Missing required information",
        description: "Please enter food name and serving size"
      });
      return;
    }

    let calories = parseFloat(manualEntryData.calories) || 0;
    let carbs = parseFloat(manualEntryData.carbs) || 0;

    // Convert serving amount to grams first
    const servingAmount = parseFloat(manualEntryData.servingSize);
    const servingGrams = convertToGrams(servingAmount, manualEntryData.servingUnit, manualEntryData.name);
    
    const per100gCalories = parseFloat(manualEntryData.calories) || 0;
    const per100gCarbs = parseFloat(manualEntryData.carbs) || 0;
    
    // Calculate actual consumption based on serving size in grams
    calories = (per100gCalories * servingGrams) / 100;
    carbs = (per100gCarbs * servingGrams) / 100;

    // If per-100g values are missing, get them from AI
    if (per100gCalories === 0 || per100gCarbs === 0) {
      try {
        const { data, error } = await supabase.functions.invoke('chat-completion', {
          body: {
            messages: [
              {
                role: 'system',
                content: 'You are a nutrition expert. Provide nutritional information for foods. Return only a JSON object with calories_per_100g and carbs_per_100g as numbers.'
              },
              {
                role: 'user',
                content: `What are the calories and carbs per 100g for ${manualEntryData.name}? Return only JSON format: {"calories_per_100g": number, "carbs_per_100g": number}`
              }
            ]
          }
        });

        if (data?.content) {
          try {
            const nutritionData = JSON.parse(data.content);
            
            if (per100gCalories === 0 && nutritionData.calories_per_100g) {
              calories = (nutritionData.calories_per_100g * servingGrams) / 100;
            }
            if (per100gCarbs === 0 && nutritionData.carbs_per_100g) {
              carbs = (nutritionData.carbs_per_100g * servingGrams) / 100;
            }
          } catch (parseError) {
            console.error('Failed to parse AI nutrition response:', parseError);
          }
        }
      } catch (error) {
        console.error('Failed to get AI nutrition data:', error);
      }
    }

    const result = await addFoodEntry({
      name: manualEntryData.name,
      calories: Math.round(calories * 100) / 100,
      carbs: Math.round(carbs * 100) / 100,
      serving_size: Math.round(servingGrams * 100) / 100, // Store the actual grams
      consumed: false
    });

    if (!result || 'error' in result) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save food entry"
      });
    } else {
        trackFoodEvent('add', 'manual');
        toast({
          title: "Food added successfully!",
          description: `${manualEntryData.name} has been added to your food plan`
        });
      setShowManualEntry(false);
    }
  };


  const handleSave = async () => {
    if (!foodName || !calories || !carbs) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in food name, calories, and carbs"
      });
      return;
    }

    const result = await addFoodEntry({
      name: foodName,
      calories: parseFloat(calories),
      carbs: parseFloat(carbs),
      serving_size: parseFloat(servingSize),
      consumed: consumedNow,
      image_url: imageUrl || undefined
    });

    if (!result || 'error' in result) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save food entry"
      });
    } else {
      toast({
        title: "Food logged",
        description: `${foodName} has been added to your diary`
      });
      // Reset form
      setFoodName('');
      setCalories('');
      setCarbs('');
      setServingSize('100');
      setImageUrl('');
      setConsumedNow(true);
      setShowForm(false);
      
      // Save to personal library if not already there
      await saveToLibrary({
        name: foodName,
        calories: parseFloat(calories),
        carbs: parseFloat(carbs),
        serving_size: parseFloat(servingSize)
      });
    }
  };

  const saveToLibrary = async (entry: { name: string; calories: number; carbs: number; serving_size: number }) => {
    try {
      // Check if food already exists in library
      const { data: existing } = await supabase
        .from('user_foods')
        .select('id')
        .eq('user_id', user?.id)
        .eq('name', entry.name)
        .single();

      if (!existing) {
        // If serving_size is 100, values are already per 100g
        // Otherwise, calculate per 100g values
        const caloriesPer100g = entry.serving_size === 100 
          ? entry.calories 
          : (entry.calories / entry.serving_size) * 100;
        const carbsPer100g = entry.serving_size === 100 
          ? entry.carbs 
          : (entry.carbs / entry.serving_size) * 100;

        await supabase
          .from('user_foods')
          .insert({
            user_id: user?.id,
            name: entry.name,
            calories_per_100g: caloriesPer100g,
            carbs_per_100g: carbsPer100g
          });
      }
    } catch (error) {
      // Silent error - don't interrupt user flow
      console.error('Error saving to library:', error);
    }
  };

  const handleSelectFromLibrary = async (food: any, consumed: boolean = false) => {
    // Directly add food to today's plan with 100g serving
    const result = await addFoodEntry({
      name: food.name,
      calories: food.calories_per_100g,
      carbs: food.carbs_per_100g,
      serving_size: 100,
      consumed: consumed,
      image_url: food.image_url || undefined
    });

    if (!result || 'error' in result) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add food entry"
      });
    } else {
      trackFoodEvent('add', 'manual');
      toast({
        title: "Food added successfully!",
        description: `${food.name} (100g) has been added to your food plan`
      });
      
      // Auto-close library view
      setShowLibraryView(false);
      
      // Save to personal library if not already there (for default foods)
      await saveToLibrary({
        name: food.name,
        calories: food.calories_per_100g,
        carbs: food.carbs_per_100g,
        serving_size: 100
      });
    }
  };

  const handleUpdateFoodEntry = async (id: string, updates: any) => {
    const result = await updateFoodEntry({ id, updates });
    if (!result || 'error' in result) {
      throw new Error("Failed to update food entry");
    }
  };

  const handleDeleteFoodEntry = async (id: string) => {
    try {
      await deleteFoodEntry(id);
      trackFoodEvent('delete', 'manual');
      toast({
        title: "Food deleted",
        description: "Food entry has been removed"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete food entry"
      });
    }
  };

  const handleToggleConsumption = async (entryId: string, consumed: boolean) => {
    try {
      await toggleConsumption(entryId);
      // Show success notification
      toast({
        variant: "default",
        title: consumed ? "Marked as eaten" : "Marked as not eaten",
        description: consumed ? "Food item has been consumed" : "Food item marked as not consumed"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update consumption status"
      });
    }
  };

  // Clear All and Template functions
  const handleClearAll = async () => {
    setClearingAll(true);
    try {
      // Delete all today's entries
      for (const entry of todayEntries) {
        await deleteFoodEntry(entry.id);
      }
      
      toast({
        title: "All foods cleared",
        description: "Successfully cleared all foods from today's plan."
      });
    } catch (error) {
      console.error('Error clearing all foods:', error);
      toast({
        title: "Error",
        description: "Failed to clear all foods. Please try again.",
        variant: "destructive"
      });
    } finally {
      setClearingAll(false);
      setShowClearAllDialog(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (todayEntries.length === 0) {
      toast({
        title: "No foods to save",
        description: "Add some foods to today's plan before saving as template.",
        variant: "destructive"
      });
      return;
    }

    const foodsToSave = todayEntries.map(entry => ({
      name: entry.name,
      calories: entry.calories,
      carbs: entry.carbs,
      serving_size: entry.serving_size,
      image_url: entry.image_url
    }));

    const { error } = await saveTemplate(foodsToSave);
    
    if (error) {
      toast({
        title: "Error saving template",
        description: "Failed to save daily template. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Template saved",
        description: "Successfully saved today's plan as your daily template."
      });
      setShowSaveTemplateDialog(false);
    }
  };

  const handleApplyTemplate = async () => {
    if (templateFoods.length === 0) {
      toast({
        title: "No template available",
        description: "Please save a daily template first.",
        variant: "destructive"
      });
      return;
    }

    const { error } = await applyTemplate();
    
    if (error) {
      toast({
        title: "Error applying template",
        description: "Failed to apply daily template. Please try again.",
        variant: "destructive"
      });
    } else {
      // Refresh the food entries to show the newly added items
      await refreshFoodEntries();
      
      toast({
        title: "Template applied",
        description: "Successfully applied your daily template to today's plan."
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-md mx-auto pt-10 pb-20">{/* FIXED: Reduced pt from 20 to 10, added max-width container */}
        {/* Header with Onboarding Button */}
        <div className="mb-4 mt-4 relative">
          <div className="absolute left-0 top-0">
            <PageOnboardingButton onClick={() => setShowOnboarding(true)} />
          </div>
          <div className="absolute right-0 top-0">
            <HistoryButton onClick={() => setShowHistory(true)} title="View food history" />
          </div>
          <div className="pl-12 pr-12">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-1">
              Food Tracking
            </h1>
            <p className="text-sm text-muted-foreground text-left">Log your food intake</p>
          </div>
        </div>



        {/* Action Buttons - Moved above Today's Food Plan */}
        <div className="my-6">
          <div className="grid grid-cols-3 gap-4">
            {/* Voice Add */}
            <PremiumGate feature="AI Food Assistant">
              <Button
                onClick={handleVoiceFood}
                variant="ai"
                size="action-tall"
                className="flex items-center justify-center"
              >
                <Mic className="w-5 h-5" />
              </Button>
            </PremiumGate>
            
            {/* Manual Add */}
            <Button
              onClick={handleManualEntry}
              variant="action-primary"
              size="action-tall"
              className="flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </Button>

            {/* Add from Library */}
            <Button
              onClick={() => setShowLibraryView(true)}
              variant="action-primary"
              size="action-tall"
              className="flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Food Plan Summary - Above tabs */}
        <FoodPlanSummary entries={todayEntries} />

        {/* Daily Food Plan System with Tabs - Remove white container */}
        <div className="mb-6 space-y-3">
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1">
              <TabsTrigger value="today" className="text-sm relative">
                Today's Plan
                {todayEntries.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-5 w-5 p-0 hover:bg-destructive/10 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowClearAllDialog(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </TabsTrigger>
              <TabsTrigger value="template" className="text-sm relative">
                Daily Template
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-5 w-5 p-0 hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSaveTemplateDialog(true);
                  }}
                >
                  <Save className="h-3 w-3" />
                </Button>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="today" className="mt-4">
          
          {todayEntries.length === 0 ? (
            <div className="text-center py-6">
              <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No foods added yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add foods using the buttons above</p>
            </div>
          ) : (
            <div className="space-y-1">
              {todayEntries.map((entry) => (
                <div key={entry.id} className={`rounded-lg p-2 mb-1 transition-all duration-200 bg-muted/20 border-0 ${
                  entry.consumed 
                    ? 'opacity-60' 
                    : ''
                }`}>
                  <div className="flex items-center gap-2">
                    
                    {/* Entry Image - Compact but visible */}
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      {entry.image_url ? (
                        <img 
                          src={entry.image_url} 
                          alt={entry.name}
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                      ) : (
                        <Utensils className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Entry Content - Compact */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-0">
                        <h3 className={`text-sm font-semibold truncate ${
                          entry.consumed ? 'text-muted-foreground line-through' : 'text-foreground'
                        }`}>
                          {entry.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">{Math.round(entry.serving_size)}g</span>
                        <span className="text-muted-foreground/60">•</span>
                        <ClickableTooltip content="Calories">
                          <span className="font-medium cursor-pointer">{Math.round(entry.calories)}</span>
                        </ClickableTooltip>
                        <span className="text-muted-foreground/60">•</span>
                        <ClickableTooltip content="Carbs">
                          <span className="font-medium cursor-pointer">{Math.round(entry.carbs)}g</span>
                        </ClickableTooltip>
                      </div>
                    </div>
                    
                    {/* Actions - Compact */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Reduced spacing */}
                      <div className="w-1"></div>
                      
                      {/* More Options Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-5 w-5 p-1 hover:bg-secondary/80 rounded"
                          >
                            <MoreVertical className="w-3 h-3 text-primary" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setEditingEntry(entry)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Entry
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteFoodEntry(entry.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Entry
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      {/* Primary Consume Button - After 3-dots (consistent with library) */}
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleToggleConsumption(entry.id, !entry.consumed)}
                        className="h-5 w-5 p-1 bg-primary hover:bg-primary/90 rounded"
                        title={entry.consumed ? "Mark as not eaten" : "Mark as eaten"}
                      >
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          </TabsContent>
          
          <TabsContent value="template" className="space-y-4">
            <div className="space-y-4">
              {templateFoods.length > 0 ? (
                <>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {templateFoods.length} food{templateFoods.length !== 1 ? 's' : ''} in daily template
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApplyTemplate}
                      disabled={templateLoading}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Apply Template
                    </Button>
                  </div>
                    <div className="space-y-1">
                     {templateFoods.map((food) => (
                       <div key={food.id} className="flex items-center justify-between p-2 bg-muted/20 border-0 rounded-lg">
                          <div className="flex items-center space-x-2">
                           {food.image_url ? (
                             <img
                               src={food.image_url}
                               alt={food.name}
                               className="w-10 h-10 rounded-lg object-cover"
                             />
                           ) : (
                             <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                               <Camera className="w-5 h-5 text-muted-foreground" />
                             </div>
                           )}
                           <div className="flex-1 min-w-0">
                             <p className="font-medium truncate">{food.name}</p>
                             <p className="text-sm text-muted-foreground">
                               {food.calories} cal, {food.carbs}g carbs • {food.serving_size}g
                             </p>
                           </div>
                         </div>
                         
                         {/* Actions - 3-dots menu */}
                         <div className="flex items-center gap-1 flex-shrink-0">
                           <div className="w-1"></div>
                           
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button 
                                 size="sm" 
                                 variant="ghost" 
                                 className="h-5 w-5 p-1 hover:bg-secondary/80 rounded"
                               >
                                 <MoreVertical className="w-3 h-3 text-primary" />
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end" className="w-44">
                               <DropdownMenuItem onClick={() => setEditingEntry(food)}>
                                 <Edit className="w-4 h-4 mr-2" />
                                 Edit Template Item
                               </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={async () => {
                                    try {
                                      await supabase
                                        .from('daily_food_templates')
                                        .delete()
                                        .eq('id', food.id);
                                      // Refresh template
                                      await loadTemplate();
                                      toast({
                                        title: "Template item deleted",
                                        description: "Item removed from daily template"
                                      });
                                    } catch (error) {
                                      toast({
                                        variant: "destructive",
                                        title: "Error",
                                        description: "Failed to delete template item"
                                      });
                                    }
                                  }}
                                 className="text-destructive focus:text-destructive"
                               >
                                 <Trash2 className="w-4 h-4 mr-2" />
                                 Delete from Template
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                         </div>
                       </div>
                     ))}
                   </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Save className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No daily template saved</p>
                  <p className="text-sm mt-2">Add foods to today's plan and save as template</p>
                </div>
              )}
            </div>
          </TabsContent>
          </Tabs>
        </div>


        {/* Food Entry Form */}
        {showForm && (
          <div className="space-y-4 mb-8">
            
            <div className="space-y-2">
              <Label htmlFor="foodName">Food Name</Label>
              <Input
                id="foodName"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="e.g., Apple, Chicken Breast"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="per serving"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="grams"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servingSize">Serving Size (g)</Label>
              <Input
                id="servingSize"
                type="number"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                placeholder="100"
              />
            </div>

            {/* Consumption Status */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Status</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={consumedNow ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setConsumedNow(true)}
                  className="flex-1 h-8 text-xs bg-secondary/20 hover:bg-secondary/30"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Eaten
                </Button>
                <Button
                  type="button"
                  variant={!consumedNow ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setConsumedNow(false)}
                  className="flex-1 h-8 text-xs bg-secondary/20 hover:bg-secondary/30"
                >
                  <X className="w-3 h-3 mr-1" />
                  Planning
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1 h-12 text-base font-semibold">
                <Save className="w-5 h-5 mr-2" />
                Add to Today's List
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowForm(false);
                  setFoodName('');
                  setCalories('');
                  setCarbs('');
                  setServingSize('100');
                  setConsumedNow(true);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Manual Food Entry Modal */}
        <ComponentErrorBoundary>
          <ManualFoodEntry
            isOpen={showManualEntry}
            onClose={() => setShowManualEntry(false)}
            onSave={handleSaveManualEntry}
            data={manualEntryData}
            onDataChange={setManualEntryData}
          />
        </ComponentErrorBoundary>


        {/* AI Chat Modal */}
        <PremiumGate feature="AI Chat Assistant" showUpgrade={false}>
          <ComponentErrorBoundary>
            <ModalAiChat
              isOpen={showAiChat}
              onClose={() => setShowAiChat(false)}
              onResult={handleAiChatResult}
              context={aiChatContext}
              title="Food Assistant"
              systemPrompt="You are a nutrition assistant helping users log food entries. Always ensure complete information: food name, portion size in grams, calories, and carbs. Provide reasonable estimates when exact values aren't known."
            />
          </ComponentErrorBoundary>
        </PremiumGate>

        {/* Food History Modal */}
        {showHistory && (
          <ComponentErrorBoundary>
            <FoodHistory onClose={() => setShowHistory(false)} />
          </ComponentErrorBoundary>
        )}


        {/* Food Library Modal - Using fullscreen pattern with content-only mode */}
        <UniversalModal
          isOpen={showLibraryView}
          onClose={() => setShowLibraryView(false)}
          title="" // Empty title since FoodLibraryView has its own header
          variant="fullscreen"
          showCloseButton={false} // FoodLibraryView has its own close button
          contentClassName="p-0" // Remove padding since FoodLibraryView handles its own spacing
        >
          <FoodLibraryView 
            onSelectFood={handleSelectFromLibrary} 
            onBack={() => setShowLibraryView(false)} 
          />
        </UniversalModal>
        
        {/* Edit Food Entry Modal */}
        <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b border-border p-4">
              <DialogTitle className="text-lg font-semibold">Edit Food Entry</DialogTitle>
            </DialogHeader>
            {editingEntry && (
              <EditFoodEntryForm 
                entry={editingEntry} 
                onUpdate={async (id: string, updates: any) => {
                  await handleUpdateFoodEntry(id, updates);
                  setEditingEntry(null);
                }}
                onCancel={() => setEditingEntry(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Onboarding Modal */}
        <PageOnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          title={onboardingContent.food.title}
          subtitle={onboardingContent.food.subtitle}
          heroQuote={onboardingContent.food.heroQuote}
        >
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-lg text-warm-text/80 mb-6">{onboardingContent.food.subtitle}</p>
            </div>
            
            {onboardingContent.food.sections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <div key={index} className="flex gap-4 p-4 rounded-xl bg-ceramic-base/50">
                  <div className="flex-shrink-0 w-12 h-12 bg-ceramic-plate rounded-full flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-warm-text" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-warm-text mb-2">{section.title}</h3>
                    <p className="text-warm-text/70 text-sm leading-relaxed">{section.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </PageOnboardingModal>
        
        {/* Clear All Confirmation Dialog */}
        <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all foods?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all foods from today's plan. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearAll}
                disabled={clearingAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {clearingAll ? "Clearing..." : "Clear All"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Save Template Confirmation Dialog */}
        <AlertDialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Save as daily template?</AlertDialogTitle>
              <AlertDialogDescription>
                This will save today's plan as your daily template. Any existing template will be replaced.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSaveAsTemplate}
                disabled={templateLoading}
              >
                {templateLoading ? "Saving..." : "Save Template"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
      </div>
    </div>
  );
};

export default FoodTracking;