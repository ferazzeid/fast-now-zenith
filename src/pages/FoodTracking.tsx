import { useState } from 'react';
import { Plus, Save, History, Edit, Trash2, X, Mic, Info, Footprints, ChevronDown, ChevronUp, Utensils, MoreVertical, Check, Camera, Brain, BookOpen } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { FoodLibraryView } from '@/components/FoodLibraryView';
import { Badge } from '@/components/ui/badge';
import { useUserLibraryIndex } from '@/hooks/useUserLibraryIndex';


import { UniversalModal } from '@/components/ui/universal-modal';
import { FoodHistory } from '@/components/FoodHistory';
import { UnifiedFoodEditModal } from '@/components/UnifiedFoodEditModal';
import { ModalAiChat } from '@/components/ModalAiChat';
import { UnifiedFoodEntry } from '@/components/UnifiedFoodEntry';
import { PremiumGate } from '@/components/PremiumGate';
import { ComponentErrorBoundary } from '@/components/ErrorBoundary';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ClickableTooltip } from '@/components/ClickableTooltip';
import { useToast } from '@/hooks/use-toast';
import { useFoodEntriesQuery } from '@/hooks/optimized/useFoodEntriesQuery';
import { useFoodWalkingCalculation } from '@/hooks/useFoodWalkingCalculation';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
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
  const [showHistory, setShowHistory] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [showUnifiedEntry, setShowUnifiedEntry] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'template'>('today');
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [showClearTemplateDialog, setShowClearTemplateDialog] = useState(false);
  const [showConfirmTemplateDialog, setShowConfirmTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('Daily Plan');
  const [pendingSaveData, setPendingSaveData] = useState<any[]>([]);

  const { user } = useAuth();
  const { toast } = useToast();
  const { profile, updateProfile } = useProfile();
  const { subscribed, hasPremiumFeatures } = useSubscription();
  const isSubscriptionActive = subscribed || hasPremiumFeatures;
  const { todayEntries, addFoodEntry, deleteFoodEntry, updateFoodEntry, toggleConsumption, refreshFoodEntries } = useFoodEntriesQuery();
  const { calculateWalkingMinutesForFood, formatWalkingTime } = useFoodWalkingCalculation();
  const { 
    templateFoods, 
    loading: templateLoading,
    saveAsTemplate,
    addToTemplate,
    clearTemplate,
    applyTemplate,
    loadTemplate: forceLoadTemplate
  } = useDailyFoodTemplate();
  const { isInLibrary, addLocal: addLibraryLocal } = useUserLibraryIndex();

  const handleVoiceFood = (result: { food: string }) => {
    trackFoodEvent('add', 'voice');
    console.log('Voice result:', result);
    setShowAiChat(true);
  };

  const handleAiChatResult = (result: any) => {
    console.log('🍽️ handleAiChatResult called with:', result);
    
    // Handle both old format (result.foodEntries) and new format (result.arguments.foods)
    let foods: any[] = [];
    
    if (result.foodEntries && Array.isArray(result.foodEntries)) {
      // Old format
      foods = result.foodEntries;
      console.log('🍽️ Using old format (foodEntries):', foods);
    } else if (result.arguments?.foods && Array.isArray(result.arguments.foods)) {
      // New format from function calls
      foods = result.arguments.foods;
      console.log('🍽️ Using new format (arguments.foods):', foods);
    } else if (result.name === 'add_multiple_foods' && result.arguments?.foods) {
      // Function call format
      foods = result.arguments.foods;
      console.log('🍽️ Using function call format:', foods);
    }

    if (foods.length > 0) {
      console.log('🍽️ Adding foods to plan:', foods);
      
      foods.forEach(async (food: any) => {
        try {
          await addFoodEntry({
            name: food.name,
            calories: food.calories,
            carbs: food.carbs,
            serving_size: food.serving_size,
            consumed: false,
            image_url: food.image_url
          });
          console.log('🍽️ Successfully added food:', food.name);
        } catch (error) {
          console.error('🍽️ Error adding food:', food.name, error);
          toast({
            variant: "destructive",
            title: "Error Adding Food",
            description: `Failed to add ${food.name} to your plan`
          });
        }
      });
      
      toast({
        title: "Foods Added",
        description: `Added ${foods.length} food${foods.length > 1 ? 's' : ''} to your plan`,
      });
      
      trackFoodEvent('add', 'voice');
    } else {
      console.warn('🍽️ No foods found in result:', result);
    }
    setShowAiChat(false);
  };

  const handleUnifiedEntry = () => {
    setShowUnifiedEntry(true);
  };

  const handleSaveUnifiedEntry = async (food: { name: string; calories: number; carbs: number; serving_size: number; image_url?: string }) => {
    const result = await addFoodEntry({
      name: food.name,
      calories: food.calories,
      carbs: food.carbs,
      serving_size: food.serving_size,
      consumed: false,
      image_url: food.image_url
    });
    
    if (!result || 'error' in result) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save food entry"
      });
    } else {
      toast({
        title: "Food Added",
        description: `${food.name} has been added to your plan`
      });
      
      trackFoodEvent('add', food.image_url ? 'image' : 'manual');
    }
    setShowUnifiedEntry(false);
  };

  const handleToggleConsumption = async (entryId: string, consumed: boolean) => {
    await toggleConsumption(entryId);
  };

  const handleDeleteFoodEntry = async (entryId: string) => {
    await deleteFoodEntry(entryId);
    toast({
      title: "Food Deleted",
      description: "Food entry has been removed from your plan"
    });
  };

  const saveToLibrary = async (food: { name: string; calories: number; carbs: number; serving_size: number }) => {
    try {
      const { data, error } = await supabase
        .from('user_foods')
        .insert([{
          user_id: user?.id,
          name: food.name,
          calories_per_100g: Math.round((food.calories / food.serving_size) * 100),
          carbs_per_100g: Math.round((food.carbs / food.serving_size) * 100)
        }]);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error saving to library:', error);
      return { error };
    }
  };

  const handleClearAllEntries = async () => {
    try {
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('user_id', user?.id)
        .gte('created_at', new Date().toISOString().split('T')[0]);
      
      if (error) throw error;
      
      await refreshFoodEntries();
      toast({
        title: "All Foods Cleared",
        description: "All food entries for today have been removed"
      });
    } catch (error) {
      console.error('Error clearing foods:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear food entries"
      });
    }
    setShowClearAllDialog(false);
  };

  const handleSaveTemplate = async () => {
    try {
      const foodsToSave = todayEntries.map(entry => ({
        name: entry.name,
        calories: entry.calories,
        carbs: entry.carbs,
        serving_size: entry.serving_size,
        image_url: entry.image_url,
      }));
      
      setPendingSaveData(foodsToSave);
      setShowSaveTemplateDialog(false);
      setShowConfirmTemplateDialog(true);
    } catch (error) {
      console.error('Error preparing template save:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to prepare template save"
      });
    }
  };

  const handleConfirmSaveTemplate = async () => {
    try {
      console.log('🍽️ Saving template with foods:', pendingSaveData);
      
      const { error } = await saveAsTemplate(pendingSaveData);
      
      if (error) {
        console.error('🍽️ Error saving template:', error);
        toast({ 
          title: 'Error', 
          description: 'Failed to save template',
          variant: 'destructive'
        });
      } else {
        console.log('🍽️ Successfully saved template');
        toast({ 
          title: 'Template Saved', 
          description: `Your daily food plan has been saved as a template` 
        });
        
        // Force refresh template if we're on the template tab
        if (activeTab === 'template') {
          console.log('🍽️ On template tab, forcing immediate refresh...');
          await forceLoadTemplate();
        }
        
        if (!profile?.enable_daily_reset) {
          await updateProfile({ enable_daily_reset: true });
        }
      }
    } catch (error) {
      console.error('🍽️ Exception saving template:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to save template',
        variant: 'destructive'
      });
    }
    setShowConfirmTemplateDialog(false);
    setPendingSaveData([]);
  };

  const handleApplyTemplate = async () => {
    try {
      console.log('🍽️ Applying template...');
      const { error } = await applyTemplate();
      
      if (error) {
        console.error('🍽️ Error applying template:', error);
        toast({ 
          title: 'Error', 
          description: 'Failed to apply template',
          variant: 'destructive'
        });
      } else {
        console.log('🍽️ Successfully applied template');
        await refreshFoodEntries();
        toast({ 
          title: 'Template Applied', 
          description: 'Your daily template has been applied to today\'s plan' 
        });
      }
    } catch (error) {
      console.error('🍽️ Exception applying template:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to apply template',
        variant: 'destructive'
      });
    }
  };

  const handleClearTemplate = async () => {
    try {
      console.log('🗑️ Clearing template...');
      const { error } = await clearTemplate();
      
      if (error) {
        console.error('🗑️ Error clearing template:', error);
        toast({ 
          title: 'Error', 
          description: 'Failed to clear template',
          variant: 'destructive'
        });
      } else {
        console.log('🗑️ Successfully cleared template');
        toast({ 
          title: 'Template Cleared', 
          description: 'Your daily template has been cleared' 
        });
      }
    } catch (error) {
      console.error('🗑️ Exception clearing template:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to clear template',
        variant: 'destructive'
      });
    }
    setShowClearTemplateDialog(false);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-background p-4 overflow-x-hidden">
      <div className="max-w-md mx-auto pt-10 pb-24">
        {/* Header with Onboarding and History Buttons */}
        <div className="mb-4 mt-4 relative">
          <div className="absolute left-0 top-0">
            <PageOnboardingButton onClick={() => setShowOnboarding(true)} />
          </div>
          <div className="absolute right-0 top-0">
            <HistoryButton onClick={() => setShowHistory(true)} title="View food history" />
          </div>
          <div className="px-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-1 flex items-center">
              <Brain className="w-6 h-6 mr-2" />
              Food Tracking
            </h1>
            <p className="text-sm text-muted-foreground text-center">Lock your food intake</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-3">
            {/* Voice Add Button */}
            <PremiumGate 
              feature="ai_food_voice"
              className="col-span-1"
            >
              <div className="flex flex-col items-center gap-2">
                <Button 
                  variant="ai"
                  size="action-tall"
                  className="w-full flex flex-col items-center justify-center gap-1"
                  onClick={() => setShowAiChat(true)}
                >
                  <Mic className="w-5 h-5" />
                </Button>
                <span className="text-xs text-muted-foreground text-center">Voice add</span>
              </div>
            </PremiumGate>

            {/* Large Unified Add Food Button */}
            <div className="flex flex-col items-center gap-2">
              <Button 
                variant={isSubscriptionActive ? "ai" : "action-primary"}
                size="start-button"
                className="w-full flex flex-col items-center justify-center gap-2"
                onClick={handleUnifiedEntry}
              >
                <Plus className="w-8 h-8" />
              </Button>
              <span className="text-xs text-muted-foreground text-center">Add food</span>
            </div>

            {/* Library Button */}
            <div className="flex flex-col items-center gap-2">
              <Button 
                variant="action-primary"
                size="action-tall"
                className="w-full flex flex-col items-center justify-center gap-1"
                onClick={() => setShowLibraryView(true)}
              >
                <BookOpen className="w-5 h-5" />
              </Button>
              <span className="text-xs text-muted-foreground text-center">Library</span>
            </div>
          </div>
        </div>

        {/* Daily Summary */}
        <div className="mb-6">
          <ComponentErrorBoundary>
            <FoodPlanSummary 
              entries={todayEntries}
            />
          </ComponentErrorBoundary>
        </div>

        {/* Food Lists */}
        <div className="space-y-6">
          <Tabs 
            value={activeTab} 
            onValueChange={async (value) => {
              setActiveTab(value as 'today' | 'template');
              if (value === 'template') {
                // Force refresh template data when switching to template tab
                console.log('🍽️ Switching to template tab, forcing refresh...');
                await forceLoadTemplate();
              }
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 p-1">
              <TabsTrigger value="today" className="text-sm font-medium flex items-center justify-between px-3">
                <span>Today's Plan</span>
                {todayEntries.length > 0 && activeTab === 'today' && (
                  <div className="flex items-center gap-4 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-primary/10 text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSaveTemplateDialog(true);
                      }}
                      aria-label="Save as template"
                      title="Save current plan as template"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-destructive/10 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowClearAllDialog(true);
                      }}
                      aria-label="Clear all foods"
                      title="Clear all foods"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </TabsTrigger>
              <TabsTrigger value="template" className="text-sm font-medium">
                Daily Template
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
                      entry.consumed ? 'opacity-60' : ''
                    }`}>
                      <div className="flex items-center gap-2">
                        
                        {/* More Options Menu - Moved to beginning */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-secondary/80 rounded flex-shrink-0"
                              aria-label="More options"
                            >
                              <MoreVertical className="w-5 h-5 text-primary" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="start" 
                            side="bottom" 
                            sideOffset={8}
                            avoidCollisions={true}
                            collisionPadding={16}
                            className="w-52 z-50 bg-background border border-border shadow-lg"
                          >
                             <DropdownMenuItem onClick={() => setEditingEntry(entry)} className="py-2.5 px-3">
                               <Edit className="w-4 h-4 mr-2" />
                               Edit Entry
                             </DropdownMenuItem>
                             <DropdownMenuItem
                               className="py-2.5 px-3"
                               onClick={async () => {
                                const result = await addFoodEntry({
                                  name: entry.name,
                                  calories: entry.calories,
                                  carbs: entry.carbs,
                                  serving_size: entry.serving_size,
                                  consumed: false,
                                  image_url: entry.image_url
                                });
                                
                                if (!result || 'error' in result) {
                                  toast({
                                    variant: "destructive",
                                    title: "Error",
                                    description: "Failed to duplicate entry"
                                  });
                                } else {
                                  toast({
                                    title: "Entry duplicated",
                                    description: `${entry.name} has been duplicated`
                                  });
                                }
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Duplicate Entry
                            </DropdownMenuItem>
                             <DropdownMenuItem
                               onClick={async () => {
                                if (isInLibrary(entry.name)) {
                                  toast({ title: 'Already in Library', description: `${entry.name} is already in your library` });
                                  return;
                                }
                                await saveToLibrary({
                                  name: entry.name,
                                  calories: entry.calories,
                                  carbs: entry.carbs,
                                  serving_size: entry.serving_size,
                                });
                                addLibraryLocal(entry.name);
                                toast({ title: 'Saved to Library', description: `${entry.name} added to your library` });
                              }}
                              className={`py-2.5 px-3 ${isInLibrary(entry.name) ? "text-muted-foreground cursor-default" : ""}`}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              {isInLibrary(entry.name) ? 'Already in Library' : 'Add to Library'}
                            </DropdownMenuItem>
                             <DropdownMenuItem
                               className="py-2.5 px-3"
                               onClick={async () => {
                                try {
                                  const foodsToSave = [{
                                    name: entry.name,
                                    calories: entry.calories,
                                    carbs: entry.carbs,
                                    serving_size: entry.serving_size,
                                    image_url: entry.image_url,
                                  }];
                                  
                                  const { error } = await addToTemplate(foodsToSave);
                                  
                                  if (error) {
                                    toast({ 
                                      title: 'Error', 
                                      description: 'Failed to add to template',
                                      variant: 'destructive'
                                    });
                                  } else {
                                    toast({ 
                                      title: 'Added to Template', 
                                      description: `${entry.name} added to your daily template` 
                                    });
                                  }
                                } catch (error) {
                                  toast({ 
                                    title: 'Error', 
                                    description: 'Failed to add to template',
                                    variant: 'destructive'
                                  });
                                }
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add to Template
                            </DropdownMenuItem>
                             <DropdownMenuItem 
                               onClick={() => handleDeleteFoodEntry(entry.id)}
                               className="py-2.5 px-3 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Entry
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
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
                        <div className="flex-1 min-w-0 relative">
                          <div className="mb-0 flex items-center gap-2 min-w-0">
                            <h3 className={`text-sm font-semibold truncate max-w-[180px] ${
                              entry.consumed ? 'text-muted-foreground line-through' : 'text-foreground'
                            }`}>
                              {entry.name}
                            </h3>
                            {isInLibrary(entry.name) && (
                              <div className="w-2 h-2 bg-green-500 rounded-full shrink-0" title="Saved to library" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className={`font-medium ${
                              Math.round(entry.serving_size) === 0 ? 'text-destructive' : ''
                            }`}>
                              {Math.round(entry.serving_size)}g
                            </span>
                            <span className="text-muted-foreground/60">•</span>
                            <ClickableTooltip content="Calories">
                              <span className={`font-medium cursor-pointer ${
                                Math.round(entry.calories) === 0 ? 'text-destructive' : ''
                              }`}>
                                {Math.round(entry.calories)}
                              </span>
                            </ClickableTooltip>
                            <span className="text-muted-foreground/60">•</span>
                            <ClickableTooltip content="Carbs">
                              <span className="font-medium cursor-pointer">{Math.round(entry.carbs)}g</span>
                            </ClickableTooltip>
                          </div>
                        </div>
                        
                        {/* Actions - Compact */}
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleToggleConsumption(entry.id, !entry.consumed)}
                            className="h-5 w-5 p-1 bg-primary hover:bg-primary/90 rounded"
                            title={entry.consumed ? "Mark as not eaten" : "Mark as eaten"}
                            aria-label={entry.consumed ? "Mark as not eaten" : "Mark as eaten"}
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
            
            <TabsContent value="template" className="mt-4">
              <div className="space-y-4 pb-20">
                {templateFoods.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/50 pb-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1.5">
                          <Switch 
                            id="activate-daily"
                            checked={profile?.enable_daily_reset || false}
                            onCheckedChange={(checked) => {
                              updateProfile({ enable_daily_reset: checked }).then((result) => {
                                if (result.error) {
                                  toast({
                                    variant: "destructive",
                                    title: "Error",
                                    description: "Failed to update daily reset setting"
                                  });
                                } else {
                                  toast({
                                    title: checked ? "Daily Reset Activated" : "Daily Reset Deactivated",
                                    description: checked 
                                      ? "Your template will automatically apply each day at midnight"
                                      : "Automatic daily reset has been disabled"
                                  });
                                }
                              });
                            }}
                            className="scale-75"
                          />
                          <Label htmlFor="activate-daily" className="text-xs font-normal">
                            Auto-apply daily
                          </Label>
                          <ClickableTooltip content="When enabled, this template will automatically replace your current food plan every day at midnight">
                            <Info className="w-3 h-3 text-muted-foreground/70 ml-1" />
                          </ClickableTooltip>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowClearTemplateDialog(true)}
                          className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Clear
                        </Button>
                        <ClickableTooltip content="Apply template to today's plan">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleApplyTemplate}
                            className="h-6 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                          </Button>
                        </ClickableTooltip>
                        <span className="text-xs font-normal text-muted-foreground">Apply today</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {templateFoods.map((food) => {
                        const foodId = food.id;
                        return (
                          <div key={food.id} className="rounded-lg p-2 mb-1 transition-all duration-200 bg-muted/20 border-0">
                            <div className="flex items-center gap-2">
                              
                              {/* More Options Menu - Moved to beginning */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0 hover:bg-secondary/80 rounded flex-shrink-0"
                                    aria-label="More options"
                                  >
                                    <MoreVertical className="w-5 h-5 text-primary" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent 
                                  align="start" 
                                  side="bottom" 
                                  sideOffset={8}
                                  avoidCollisions={true}
                                  collisionPadding={16}
                                  className="w-52 z-50 bg-background border border-border shadow-lg"
                                >
                                   <DropdownMenuItem 
                                     className="py-2.5 px-3"
                                     onClick={() => {
                                      // Create a mock entry for editing template items
                                      const mockEntry = {
                                        id: food.id,
                                        name: food.name,
                                        calories: food.calories,
                                        carbs: food.carbs,
                                        serving_size: food.serving_size,
                                        image_url: food.image_url,
                                        consumed: false,
                                        user_id: user?.id || '',
                                        created_at: new Date().toISOString(),
                                        updated_at: new Date().toISOString(),
                                        source_date: new Date().toISOString().split('T')[0]
                                      };
                                      setEditingEntry(mockEntry);
                                    }}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Entry
                                  </DropdownMenuItem>
                                   <DropdownMenuItem
                                     className="py-2.5 px-3"
                                     onClick={async () => {
                                      const currentFood = templateFoods.find(f => f.id === foodId);
                                      if (!currentFood) {
                                        toast({
                                          variant: "destructive",
                                          title: "Error",
                                          description: "Food item not found"
                                        });
                                        return;
                                      }
                                      
                                      try {
                                        const foodsToSave = [{
                                          name: currentFood.name,
                                          calories: currentFood.calories,
                                          carbs: currentFood.carbs,
                                          serving_size: currentFood.serving_size,
                                          image_url: currentFood.image_url,
                                        }];
                                        
                                        const { error } = await addToTemplate(foodsToSave);
                                        
                                        if (error) {
                                          toast({ 
                                            title: 'Error', 
                                            description: 'Failed to duplicate template item',
                                            variant: 'destructive'
                                          });
                                        } else {
                                          toast({ 
                                            title: 'Template item duplicated', 
                                            description: `${currentFood.name} has been duplicated in template` 
                                          });
                                        }
                                      } catch (error) {
                                        toast({ 
                                          title: 'Error', 
                                          description: 'Failed to duplicate template item',
                                          variant: 'destructive'
                                        });
                                      }
                                    }}
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Duplicate Entry
                                  </DropdownMenuItem>
                                   <DropdownMenuItem
                                     onClick={async () => {
                                      const currentFood = templateFoods.find(f => f.id === foodId);
                                      if (!currentFood) {
                                        toast({
                                          variant: "destructive",
                                          title: "Error",
                                          description: "Food item not found"
                                        });
                                        return;
                                      }
                                      
                                      if (isInLibrary(currentFood.name)) {
                                        toast({ title: 'Already in Library', description: `${currentFood.name} is already in your library` });
                                        return;
                                      }
                                      
                                      await saveToLibrary({
                                        name: currentFood.name,
                                        calories: currentFood.calories,
                                        carbs: currentFood.carbs,
                                        serving_size: currentFood.serving_size,
                                      });
                                      addLibraryLocal(currentFood.name);
                                      toast({ title: 'Saved to Library', description: `${currentFood.name} added to your library` });
                                    }}
                                    className={`py-2.5 px-3 ${isInLibrary(food.name) ? "text-muted-foreground cursor-default" : ""}`}
                                  >
                                    <Save className="w-4 h-4 mr-2" />
                                    {isInLibrary(food.name) ? 'Already in Library' : 'Add to Library'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={async () => {
                                      const currentFood = templateFoods.find(f => f.id === foodId);
                                      if (!currentFood) {
                                        toast({
                                          variant: "destructive",
                                          title: "Error",
                                          description: "Food item not found"
                                        });
                                        return;
                                      }
                                      
                                      try {
                                        const result = await addFoodEntry({
                                          name: currentFood.name,
                                          calories: currentFood.calories,
                                          carbs: currentFood.carbs,
                                          serving_size: currentFood.serving_size,
                                          image_url: currentFood.image_url,
                                          consumed: false
                                        });

                                        if (!result || 'error' in result) {
                                          toast({
                                            variant: "destructive",
                                            title: "Error",
                                            description: "Failed to add to today's plan"
                                          });
                                        } else {
                                          toast({
                                            title: "Added to Today's Plan",
                                            description: `${currentFood.name} added to today's food plan`
                                          });
                                        }
                                      } catch (error) {
                                        toast({
                                          variant: "destructive",
                                          title: "Error",
                                          description: `Failed to add to today's plan: ${error.message || 'Unknown error'}`
                                        });
                                      }
                                    }}
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add to Today
                                  </DropdownMenuItem>
                                   <DropdownMenuItem 
                                     onClick={async () => {
                                      const currentFood = templateFoods.find(f => f.id === foodId);
                                      if (!currentFood) {
                                        toast({
                                          variant: "destructive",
                                          title: "Error", 
                                          description: "Food item not found"
                                        });
                                        return;
                                      }
                                      
                                      try {
                                        const { data, error } = await supabase
                                          .from('daily_food_templates')
                                          .delete()
                                          .eq('id', currentFood.id)
                                          .eq('user_id', user?.id)
                                          .select();
                                        
                                        if (error) {
                                          throw error;
                                        }
                                        
                                        if (!data || data.length === 0) {
                                          toast({
                                            variant: "destructive",
                                            title: "Error",
                                            description: "Template item not found or already deleted"
                                          });
                                          return;
                                        }
                                        
                                        // Template will refresh automatically
                                        await refreshFoodEntries();
                                        
                                        toast({
                                          title: "Template item deleted",
                                          description: `${currentFood.name} removed from daily template`
                                        });
                                      } catch (error) {
                                        toast({
                                          variant: "destructive",
                                          title: "Error",
                                          description: `Failed to delete template item: ${error.message || 'Unknown error'}`
                                        });
                                      }
                                    }}
                                    className="py-2.5 px-3 text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Entry
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              
                              {/* Entry Image - Compact but visible */}
                              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                                {food.image_url ? (
                                  <img 
                                    src={food.image_url} 
                                    alt={food.name}
                                    className="w-10 h-10 object-cover rounded-lg"
                                  />
                                ) : (
                                  <Utensils className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              
                              {/* Entry Content - Compact */}
                              <div className="flex-1 min-w-0 relative">
                                <div className="mb-0 flex items-center gap-2 min-w-0">
                                  <h3 className="text-sm font-semibold truncate max-w-[180px] text-foreground">
                                    {food.name}
                                  </h3>
                                  {isInLibrary(food.name) && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full shrink-0" title="Saved to library" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="font-medium">
                                    {food.calories} cal, {food.carbs}g carbs • {food.serving_size}g
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
      </div>

      {/* Modals */}
      <PageOnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        title="Food Tracking Guide"
      >
        <div>Food tracking onboarding content</div>
      </PageOnboardingModal>

      <UniversalModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="Food History"
        size="lg"
      >
        <FoodHistory onClose={() => setShowHistory(false)} />
      </UniversalModal>

      <UniversalModal
        isOpen={showLibraryView}
        onClose={() => setShowLibraryView(false)}
        title=""
        size="xl"
        variant="fullscreen"
      >
        <FoodLibraryView 
          onSelectFood={async (food: any, consumed = false) => {
            // Convert food to proper format for addFoodEntry
            const foodEntry = {
              name: food.name,
              calories: food.calories_per_100g || food.calories,
              carbs: food.carbs_per_100g || food.carbs,
              serving_size: 100,
              consumed: consumed,
              image_url: food.image_url
            };
            
            const result = await addFoodEntry(foodEntry);
            
            if (!result || 'error' in result) {
              toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to add food to your plan"
              });
            } else {
              toast({
                title: "Food Added",
                description: `${food.name} has been added to your plan`
              });
            }
          }} 
          onBack={() => setShowLibraryView(false)} 
        />
      </UniversalModal>

      {editingEntry && (
        <UnifiedFoodEditModal
          isOpen={!!editingEntry}
          onClose={() => setEditingEntry(null)}
          entry={editingEntry}
          mode="entry"
          onUpdate={async (updatedEntry: any) => {
            // Check if this is a template item by checking if it exists in templateFoods
            const isTemplateItem = templateFoods.some(f => f.id === editingEntry.id);
            
            if (isTemplateItem) {
              // Update template item
              try {
                const { error } = await supabase
                  .from('daily_food_templates')
                  .update({
                    name: updatedEntry.name,
                    calories: updatedEntry.calories,
                    carbs: updatedEntry.carbs,
                    serving_size: updatedEntry.serving_size,
                    image_url: updatedEntry.image_url,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', editingEntry.id)
                  .eq('user_id', user?.id);
                
                if (error) {
                  throw error;
                }
                
                // Refresh template data
                await forceLoadTemplate();
                
                toast({
                  title: "Template Updated",
                  description: "Template item has been updated successfully"
                });
              } catch (error) {
                toast({
                  variant: "destructive",
                  title: "Error",
                  description: `Failed to update template item: ${error.message || 'Unknown error'}`
                });
              }
            } else {
              // Update regular food entry
              await updateFoodEntry({ id: editingEntry.id, updates: updatedEntry });
              toast({
                title: "Food Updated",
                description: "Food entry has been updated successfully"
              });
            }
            setEditingEntry(null);
          }}
        />
      )}

      <ModalAiChat
        isOpen={showAiChat}
        onClose={() => setShowAiChat(false)}
        onResult={handleAiChatResult}
      />

        {/* Unified Food Entry Modal */}
        <UnifiedFoodEntry
          isOpen={showUnifiedEntry}
          onClose={() => setShowUnifiedEntry(false)}
          onSave={handleSaveUnifiedEntry}
        />

      {/* Dialogs */}
      <AlertDialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save as Daily Template</AlertDialogTitle>
            <AlertDialogDescription>
              This will save your current food plan as a daily template. You can then apply this template to future days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveTemplate}>Save Template</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConfirmTemplateDialog} onOpenChange={setShowConfirmTemplateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Template Save</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your existing daily template with {pendingSaveData.length} food item{pendingSaveData.length !== 1 ? 's' : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSaveData([])}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSaveTemplate}>Confirm Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Foods</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all food entries from today's plan. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAllEntries} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showClearTemplateDialog} onOpenChange={setShowClearTemplateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Daily Template</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all items from your daily template. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearTemplate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FoodTracking;