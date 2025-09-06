import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Save, History, Edit, Trash2, X, Mic, Info, Footprints, ChevronDown, ChevronUp, Utensils, MoreVertical, Check, Camera, Brain, BookOpen } from 'lucide-react';
import { convertToGrams } from '@/utils/foodConversions';
import { PremiumGatedFoodVoiceButton } from '@/components/PremiumGatedFoodVoiceButton';
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
import { EditFoodEntryModal } from '@/components/EditFoodEntryModal';
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
import { useAccess } from '@/hooks/useAccess';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { trackFoodEvent, trackAIEvent } from '@/utils/analytics';
import { useDailyFoodTemplate } from '@/hooks/useDailyFoodTemplate';
import { FoodPlanSummary } from '@/components/FoodPlanSummary';
import { AuthorTooltip } from '@/components/AuthorTooltip';
import { ResponsivePageHeader } from '@/components/ResponsivePageHeader';

const FoodTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [consumedNow, setConsumedNow] = useState(true);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  
  const [showLibraryView, setShowLibraryView] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [showUnifiedEntry, setShowUnifiedEntry] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'template'>(() => {
    // Persist active tab across page refreshes
    const savedTab = localStorage.getItem('food-tracking-active-tab');
    return (savedTab === 'template' || savedTab === 'today') ? savedTab : 'today';
  });
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [showClearTemplateDialog, setShowClearTemplateDialog] = useState(false);
  const [showConfirmTemplateDialog, setShowConfirmTemplateDialog] = useState(false);
  const [showApplyTemplateDialog, setShowApplyTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('Daily Plan');
  const [pendingSaveData, setPendingSaveData] = useState<any[]>([]);

  const { user } = useAuth();
  const { toast } = useToast();
  const { profile, updateProfile } = useProfile();
  const { hasAccess, hasPremiumFeatures, isAdmin } = useAccess();
  const isSubscriptionActive = hasAccess || hasPremiumFeatures;
  const { todayEntries, addFoodEntry, addMultipleFoodEntries, deleteFoodEntry, updateFoodEntry, toggleConsumption, clearAllEntries, refreshFoodEntries } = useFoodEntriesQuery();
  const { calculateWalkingMinutesForFood, formatWalkingTime } = useFoodWalkingCalculation();
  const { 
    templateFoods, 
    loading: templateLoading,
    saveAsTemplate,
    addToTemplate,
    clearTemplate,
    applyTemplate,
    loadTemplate: forceLoadTemplate,
    deleteTemplateFood
  } = useDailyFoodTemplate();
  const { isInLibrary, addLocal: addLibraryLocal } = useUserLibraryIndex();

  // Close modals when navigating to auth routes to prevent OAuth interaction errors
  useEffect(() => {
    if (location.pathname === '/auth' || location.pathname === '/auth-callback') {
      setShowLibraryView(false);
      setShowHistory(false);
      setShowAiChat(false);
      setShowUnifiedEntry(false);
      setShowOnboarding(false);
    }
  }, [location.pathname]);

  const handleVoiceFood = (result: { food: string }) => {
    trackFoodEvent('add', 'voice');
    console.log('Voice result:', result);
    setShowAiChat(true);
  };

  const handleAiChatResult = async (result: any) => {
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
      console.log('🍽️ Adding foods in bulk:', foods.length, 'items');
      
      try {
        // Use bulk insert for better performance and user experience
        await addMultipleFoodEntries(foods.map(food => ({
          name: food.name,
          calories: food.calories,
          carbs: food.carbs,
          serving_size: food.serving_size,
          consumed: false,
          image_url: food.image_url
        })));
        
        console.log('🍽️ Successfully added all foods in bulk');
        trackFoodEvent('add', 'voice');
      } catch (error) {
        console.error('🍽️ Error adding foods in bulk:', error);
        toast({
          variant: "destructive",
          title: "Failed to Add Foods",
          description: "Please try again or add foods individually.",
        });
      }
    } else {
      console.warn('🍽️ No foods found in result:', result);
    }
    setShowAiChat(false);
  };

  const handleUnifiedEntry = () => {
    navigate('/add-food');
  };

  const handleSaveUnifiedEntry = async (data: any | any[]) => {
    // Handle both single entry and array of entries
    const entries = Array.isArray(data) ? data : [data];
    
    console.log('🍽️ Saving entries in bulk:', entries.length, 'items');
    
    try {
      // Use bulk insert for better performance
      await addMultipleFoodEntries(entries.map(food => ({
        name: food.name,
        calories: food.calories,
        carbs: food.carbs,
        serving_size: food.serving_size,
        consumed: false,
        image_url: food.image_url
      })));
      
      console.log('🍽️ Successfully saved all entries in bulk');
      trackFoodEvent('add', 'manual');
    } catch (error) {
      console.error('🍽️ Error saving entries in bulk:', error);
      toast({
        variant: "destructive",
        title: "Failed to Save Foods",
        description: "Please try again or add foods individually.",
      });
    }

    // Don't automatically close the modal - let UnifiedFoodEntry manage its own state
    // This prevents premature closing during photo analysis workflow
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
      // Clear UI state immediately (like Daily Template)
      clearAllEntries();

      // Create proper date range for today
      const todayDate = new Date();
      const startOfDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
      const endOfDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + 1);
      
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('user_id', user?.id)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());
      
      if (error) throw error;
      
      toast({
        title: "All Foods Cleared",
        description: "All food entries for today have been removed"
      });
    } catch (error) {
      console.error('Error clearing foods:', error);
      // Refresh on error to restore accurate state
      await refreshFoodEntries();
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
        
        // Automatically switch to Today tab to show applied foods
        setActiveTab('today');
        localStorage.setItem('food-tracking-active-tab', 'today');
        
        toast({ 
          title: 'Template Applied', 
          description: 'Your daily template has been added to today\'s plan' 
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
    setShowApplyTemplateDialog(false);
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
      <div className="max-w-md mx-auto pt-16 pb-32 safe-bottom">
        {/* Header with left-aligned text and History Button */}
        <div className="flex flex-col mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-left">Food Tracking</h1>
              <p className="text-muted-foreground text-left">Track your food intake</p>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <AuthorTooltip 
                  contentKey="food_tracking_insights"
                  content="Proper nutrition tracking helps you understand your body's needs, maintain consistent energy levels, and develop sustainable eating habits. Focus on nutrient density rather than just calories!"
                />
              )}
              <HistoryButton 
                onClick={() => setShowHistory(true)}
                title="View food history"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons - Three Column Layout */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="col-span-1 flex flex-col items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="action-primary"
                  size="action-tall"
                  className="w-full flex items-center justify-center"
                  onClick={handleUnifiedEntry}
                  aria-label="Add food manually"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add food by typing name, calories, and other details</p>
              </TooltipContent>
            </Tooltip>
            <span className="text-xs text-muted-foreground">Add Food</span>
          </div>

          <div className="col-span-1 flex flex-col items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <PremiumGatedFoodVoiceButton />
              </TooltipTrigger>
              <TooltipContent>
                <p>Use voice to add food with AI assistance</p>
              </TooltipContent>
            </Tooltip>
            <span className="text-xs text-muted-foreground">Voice</span>
          </div>

          <div className="col-span-1 flex flex-col items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="action-secondary"
                  size="action-tall"
                  className="w-full flex items-center justify-center"
                  onClick={() => setShowLibraryView(true)}
                  aria-label="Browse food library"
                >
                  <BookOpen className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Browse and select from your saved food library</p>
              </TooltipContent>
            </Tooltip>
            <span className="text-xs text-muted-foreground">My Foods</span>
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
              const newTab = value as 'today' | 'template';
              setActiveTab(newTab);
              // Persist tab selection to localStorage
              localStorage.setItem('food-tracking-active-tab', newTab);
              
              if (newTab === 'template') {
                // Force refresh template data when switching to template tab
                console.log('🍽️ Switching to template tab, forcing refresh...');
                await forceLoadTemplate();
              }
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 p-1">
              <TabsTrigger value="today" className="text-sm font-medium flex items-center justify-between px-3">
                <span>Today</span>
                {todayEntries.length > 0 && activeTab === 'today' && (
                  <div className="flex items-center gap-4 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-foreground/10 text-foreground"
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
                       className="h-5 w-5 p-0 hover:bg-destructive/10 text-destructive mr-3 md:mr-0"
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
                <div className="text-center py-8 text-muted-foreground">
                  <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p>No foods added yet</p>
                  <p className="text-sm mt-2">Add foods using the buttons above</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {todayEntries.map((entry) => (
                    <div key={entry.id} className={`rounded-lg p-2 mb-1 transition-all duration-200 bg-card border border-ceramic-rim ${
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
                              <MoreVertical className="w-5 h-5 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              align="start" 
                              side="bottom" 
                              sideOffset={8}
                              avoidCollisions={true}
                              collisionPadding={16}
                              className="w-52 z-[60] bg-popover border shadow-lg"
                            >
                               <DropdownMenuItem onClick={() => setEditingEntry(entry)} className="py-2.5 px-3">
                                 <Edit className="w-4 h-4 mr-2" />
                                 Edit Food
                               </DropdownMenuItem>
                             <DropdownMenuItem
                               className="py-2.5 px-3"
                               onClick={async () => {
                                const currentIndex = todayEntries.findIndex(e => e.id === entry.id);
                                const result = await addFoodEntry({
                                  name: entry.name,
                                  calories: entry.calories,
                                  carbs: entry.carbs,
                                  serving_size: entry.serving_size,
                                  consumed: false,
                                  image_url: entry.image_url,
                                  insertAfterIndex: currentIndex
                                });
                                
                                if (!result || 'error' in result) {
                                  toast({
                                    variant: "destructive",
                                    title: "Error",
                                    description: "Failed to duplicate food"
                                  });
                                } else {
                                  toast({
                                    title: "Food Duplicated",
                                    description: `${entry.name} has been duplicated`
                                  });
                                }
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Duplicate Food
                            </DropdownMenuItem>
                             <DropdownMenuItem
                               className="py-2.5 px-3"
                                onClick={async () => {
                                 try {
                                   console.log('🍽️ Adding to template:', entry.name);
                                   const foodsToSave = [{
                                     name: entry.name,
                                     calories: entry.calories,
                                     carbs: entry.carbs,
                                     serving_size: entry.serving_size,
                                     image_url: entry.image_url,
                                   }];
                                   
                                   const { error } = await addToTemplate(foodsToSave);
                                   
                                   if (error) {
                                     console.error('🍽️ Error adding to template:', error);
                                     toast({ 
                                       title: 'Error', 
                                       description: `Failed to add to template: ${error.message || 'Unknown error'}`,
                                       variant: 'destructive'
                                     });
                                   } else {
                                     console.log('🍽️ Successfully added to template');
                                     toast({ 
                                       title: 'Added to Template', 
                                       description: `${entry.name} added to your daily template` 
                                     });
                                   }
                                 } catch (error) {
                                   console.error('🍽️ Exception adding to template:', error);
                                   toast({ 
                                     title: 'Error', 
                                     description: `Failed to add to template: ${error.message || 'Unknown error'}`,
                                     variant: 'destructive'
                                   });
                                 }
                               }}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add to Template
                            </DropdownMenuItem>
                             <DropdownMenuItem 
                               onClick={async () => {
                                 try {
                                   console.log('🍽️ Deleting food entry:', entry.name);
                                   await handleDeleteFoodEntry(entry.id);
                                 } catch (error) {
                                   console.error('🍽️ Error deleting food entry:', error);
                                   toast({
                                     variant: "destructive",
                                     title: "Error",
                                     description: `Failed to delete food: ${error.message || 'Unknown error'}`
                                   });
                                 }
                               }}
                               className="py-2.5 px-3 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
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
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button
                                 variant="default"
                                 size="sm"
                                 onClick={() => setShowApplyTemplateDialog(true)}
                                 className="h-8 w-8 p-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                 aria-label="Apply template to today's plan"
                               >
                                 <Plus className="w-4 h-4" />
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent>
                               <p>Apply template to today's plan</p>
                             </TooltipContent>
                           </Tooltip>
                           <Label className="text-xs font-normal">
                             Apply Template
                           </Label>
                         </div>
                       </div>
                       
                       <div className="flex items-center space-x-2">
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => setShowClearTemplateDialog(true)}
                           className="h-5 w-5 p-0 hover:bg-destructive/10 text-destructive mr-1 md:mr-0"
                           aria-label="Clear template"
                           title="Clear template"
                         >
                           <Trash2 className="w-3 h-3" />
                         </Button>
                       </div>
                     </div>
                    
                    <div className="space-y-1">
                      {templateFoods.map((food, index) => {
                        const foodId = food.id;
                        const currentIndex = index;
                        return (
                          <div key={food.id} className="rounded-lg p-2 mb-1 transition-all duration-200 bg-card border border-ceramic-rim">
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
                                    <MoreVertical className="w-5 h-5 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                 <DropdownMenuContent 
                                   align="start" 
                                   side="bottom" 
                                   sideOffset={8}
                                   avoidCollisions={true}
                                   collisionPadding={16}
                                   className="w-52 z-[60] bg-popover border shadow-lg"
                                 >
                                   <DropdownMenuItem onClick={handleUnifiedEntry} className="py-2.5 px-3">
                                     <Plus className="w-4 h-4 mr-2" />
                                     Add Food
                                   </DropdownMenuItem>
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
                                   Edit Food
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
                                       
                                        const { error } = await addToTemplate(foodsToSave, currentIndex);
                                       
                                       if (error) {
                                         toast({ 
                                           title: 'Error', 
                                           description: 'Failed to duplicate food',
                                           variant: 'destructive'
                                         });
                                       } else {
                                         toast({ 
                                           title: 'Food Duplicated', 
                                           description: `${currentFood.name} has been duplicated in template` 
                                         });
                                       }
                                     } catch (error) {
                                       toast({ 
                                         title: 'Error', 
                                         description: 'Failed to duplicate food',
                                         variant: 'destructive'
                                       });
                                     }
                                   }}
                                 >
                                   <Plus className="w-4 h-4 mr-2" />
                                   Duplicate Food
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
                                           title: "Added to Today",
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
                                   className="py-2.5 px-3"
                                 >
                                   <Plus className="w-4 h-4 mr-2" />
                                   Add to Today
                                 </DropdownMenuItem>
                                   <DropdownMenuItem 
                                     onClick={async () => {
                                      try {
                                        const { error, deletedFood } = await deleteTemplateFood(foodId);
                                        
                                        if (error) {
                                          toast({
                                            variant: "destructive",
                                            title: "Error",
                                            description: error.message || "Failed to delete food"
                                          });
                                          return;
                                        }
                                        
                                        toast({
                                          title: "Food Deleted",
                                          description: `${deletedFood?.name || 'Food item'} removed from template`
                                        });
                                      } catch (error) {
                                        toast({
                                          variant: "destructive",
                                          title: "Error",
                                          description: "Failed to delete food"
                                        });
                                      }
                                    }}
                                   className="py-2.5 px-3 text-destructive focus:text-destructive"
                                 >
                                   <Trash2 className="w-4 h-4 mr-2" />
                                   Delete
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
                    <Save className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
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
        <FoodHistory onClose={() => setShowHistory(false)} onCopySuccess={refreshFoodEntries} />
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
            try {
              // Convert food to proper format for addFoodEntry
              const foodEntry = {
                name: food.name,
                calories: food.calories_per_100g || food.calories,
                carbs: food.carbs_per_100g || food.carbs,
                serving_size: 100,
                consumed: consumed,
                image_url: food.image_url
              };
              
              // Add the food entry (optimistic updates already handle UI refresh)
              await addFoodEntry(foodEntry);
              
              // Show success feedback
              toast({
                title: "Food added",
                description: `${food.name} added to today's list`,
              });
            } catch (error) {
              // Error is already handled by the mutation, just log it
              console.error('Error adding food from library:', error);
            }
          }}
          onBack={() => setShowLibraryView(false)} 
        />
      </UniversalModal>

      {editingEntry && (
        <EditFoodEntryModal
          isOpen={!!editingEntry}
          onClose={() => setEditingEntry(null)}
          entry={editingEntry}
          onUpdate={async (updatedEntry) => {
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
              } catch (error: any) {
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
        title="Food Assistant"
        systemPrompt="You are a focused food tracking assistant. You can only help with food operations: adding, editing, and managing food entries."
        proactiveMessage="Hi! What food would you like to add? You can add multiple at once - just tell me the name and the quantity"
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

      <AlertDialog open={showApplyTemplateDialog} onOpenChange={setShowApplyTemplateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Template to Today's Plan</AlertDialogTitle>
            <AlertDialogDescription>
              This will add all foods from your daily template to today's plan. Your existing foods will be kept - the template foods will be added alongside them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApplyTemplate} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Add to Today
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FoodTracking;