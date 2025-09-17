import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Utensils, MoreVertical, Check, X, BookOpen, Lock, Crown, Save } from 'lucide-react';
import { convertToGrams } from '@/utils/foodConversions';
import { DirectVoiceFoodInput } from '@/components/DirectVoiceFoodInput';
import { DirectPhotoCaptureButton } from '@/components/DirectPhotoCaptureButton';
import { HistoryButton } from '@/components/HistoryButton';
import { PageOnboardingModal } from '@/components/PageOnboardingModal';
import { onboardingContent } from '@/data/onboardingContent';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { EditFoodEntryModal } from '@/components/EditFoodEntryModal';
import { ComponentErrorBoundary } from '@/components/ErrorBoundary';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ClickableTooltip } from '@/components/ClickableTooltip';
import { useToast } from '@/hooks/use-toast';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { useFoodEntriesQuery } from '@/hooks/optimized/useFoodEntriesQuery';
import { useFoodWalkingCalculation } from '@/hooks/useFoodWalkingCalculation';
import { useProfile } from '@/hooks/useProfile';
import { useAccess } from '@/hooks/useAccess';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { trackFoodEvent } from '@/utils/analytics';
import { CompactFoodSummary } from '@/components/CompactFoodSummary';
import { FoodStatsCard } from '@/components/FoodStatsCard';
import { ResponsivePageHeader } from '@/components/ResponsivePageHeader';
import { AccessGate } from '@/components/AccessGate';
import { useDailyFoodTemplate } from '@/hooks/useDailyFoodTemplate';
import { SmartImage } from '@/components/SmartImage';

const FoodTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [consumedNow, setConsumedNow] = useState(true);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [showSaveToTemplateDialog, setShowSaveToTemplateDialog] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const { execute: executeClearAll, isLoading: isClearingAll } = useStandardizedLoading();
  const { profile, updateProfile } = useProfile();
  const { hasAccess, hasPremiumFeatures, isAdmin } = useAccess();
  const isSubscriptionActive = hasAccess || hasPremiumFeatures;
  const { todayEntries, addFoodEntry, addMultipleFoodEntries, deleteFoodEntry, updateFoodEntry, toggleConsumption, clearAllEntries, refreshFoodEntries } = useFoodEntriesQuery();
  const { calculateWalkingMinutesForFood, formatWalkingTime } = useFoodWalkingCalculation();
  
  // Daily template functionality
  const { saveAsTemplate, addToTemplate } = useDailyFoodTemplate();

  // Close modals when navigating to auth routes to prevent OAuth interaction errors
  useEffect(() => {
    if (location.pathname === '/auth' || location.pathname === '/auth-callback') {
      setShowOnboarding(false);
      setEditingEntry(null);
      setShowClearAllDialog(false);
      setShowSaveToTemplateDialog(null);
    }
  }, [location.pathname]);

  const handlePhotoCapture = async (food: any) => {
    try {
      if (food) {
        await addFoodEntry(food);
        // Toast is already shown by DirectPhotoCaptureButton
      }
    } catch (error) {
      console.error('Error adding food from photo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add food from photo"
      });
    }
  };

  const handleSaveToTemplateConfirm = async () => {
    try {
      const foodsToSave = todayEntries.map(entry => ({
        name: entry.name,
        calories: entry.calories,
        carbs: entry.carbs,
        serving_size: entry.serving_size,
        image_url: entry.image_url
      }));
      
      const result = await saveAsTemplate(foodsToSave, true); // true = append mode
      
      if (!result.error) {
        toast({
          title: "Saved to Template",
          description: `${foodsToSave.length} food${foodsToSave.length > 1 ? 's' : ''} added to your daily template`,
        });
      } else {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Error saving to template:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save foods to template"
      });
    }
    setShowSaveToTemplateDialog(false);
  };

  const handleVoiceInput = async (entries: any[]) => {
    try {
      if (entries && entries.length > 0) {
        await addMultipleFoodEntries(entries);
        toast({
          title: "Foods Added",
          description: `${entries.length} food${entries.length > 1 ? 's' : ''} added by voice`
        });
      }
    } catch (error) {
      console.error('Error adding foods by voice:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add foods by voice"
      });
    }
  };

  const handleTextInput = async (entries: any[]) => {
    try {
      if (entries && entries.length > 0) {
        await addMultipleFoodEntries(entries);
        toast({
          title: "Foods Added",
          description: `${entries.length} food${entries.length > 1 ? 's' : ''} added to your log`
        });
      }
    } catch (error) {
      console.error('Error processing text input:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add foods from text input"
      });
    }
  };


  const handleToggleConsumption = async (entryId: string, consumed: boolean) => {
    try {
      await toggleConsumption(entryId);
    } catch (error) {
      console.error('Error toggling consumption:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update food status"
      });
    }
  };

  const handleSaveToTemplate = async () => {
    try {
      const foodsToSave = todayEntries.map(entry => ({
        name: entry.name,
        calories: entry.calories,
        carbs: entry.carbs,
        serving_size: entry.serving_size,
        image_url: entry.image_url
      }));
      
      const result = await saveAsTemplate(foodsToSave, true); // true = append mode
      
      if (!result.error) {
        toast({
          title: "Saved to Template",
          description: `${foodsToSave.length} food${foodsToSave.length > 1 ? 's' : ''} added to your daily template`,
        });
      } else {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Error saving to template:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save foods to template"
      });
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteFoodEntry(entryId);
      toast({
        title: "Food Deleted",
        description: "Food entry has been removed"
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete food entry"
      });
    }
  };

  const handleMarkAllAsEaten = async () => {
    const uneatenEntries = todayEntries.filter(entry => !entry.consumed);
    
    if (uneatenEntries.length === 0) {
      toast({
        title: "No uneaten foods",
        description: "All foods are already marked as eaten"
      });
      return;
    }

    try {
      // Mark all uneaten entries as consumed
      for (const entry of uneatenEntries) {
        await toggleConsumption(entry.id);
      }
      
      toast({
        title: "All foods marked as eaten",
        description: `Marked ${uneatenEntries.length} food${uneatenEntries.length === 1 ? '' : 's'} as eaten`
      });
    } catch (error) {
      console.error('Error marking all as eaten:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark all foods as eaten"
      });
    }
  };

  const handleClearAll = async () => {
    return executeClearAll(async () => {
      const todayDate = new Date();
      const startOfDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
      const endOfDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + 1);
      
      // Add timeout wrapper to prevent indefinite processing
      const deleteOperation = async () => {
        const { error } = await supabase
          .from('food_entries')
          .delete()
          .eq('user_id', user?.id)
          .gte('created_at', startOfDay.toISOString())
          .lt('created_at', endOfDay.toISOString());
        
        if (error) throw error;
        return true;
      };

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), 15000)
      );

      await Promise.race([deleteOperation(), timeoutPromise]);
      
      return true;
    }, {
      onSuccess: () => {
        // Only clear UI cache AFTER successful database deletion
        clearAllEntries();
        toast({
          title: "All Foods Cleared",
          description: "All food entries for today have been removed"
        });
        setShowClearAllDialog(false);
      },
      onError: async (error) => {
        console.error('Error clearing foods:', error);
        // Refresh to ensure UI reflects actual database state
        await refreshFoodEntries();
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to clear food entries"
        });
      }
    });
  };

  const renderFoodEntryCard = (entry: any) => (
    <Card key={entry.id} className={`p-2 transition-all duration-200 ${
      entry.consumed ? 'opacity-60' : ''
    }`}>
      <div className="flex items-center gap-2">
        
        {/* More Options Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0 flex-shrink-0 text-muted-foreground hover:text-foreground" 
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="bottom">
            <DropdownMenuItem
              onClick={() => {
                console.log('Edit button clicked for entry:', entry);
                setEditingEntry(entry);
                console.log('editingEntry state set to:', entry);
              }}
              className="py-2.5 px-3 focus:text-foreground"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                try {
                  const duplicatedFood = {
                    name: entry.name,
                    calories: entry.calories,
                    carbs: entry.carbs,
                    serving_size: entry.serving_size,
                    image_url: entry.image_url,
                    consumed: false
                  };
                  await addFoodEntry(duplicatedFood);
                  toast({
                    title: "Food Duplicated",
                    description: `${entry.name} has been duplicated`
                  });
                } catch (error) {
                  console.error('Error duplicating food:', error);
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to duplicate food"
                  });
                }
              }}
              className="py-2.5 px-3 focus:text-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowSaveToTemplateDialog(entry)}
              className="py-2.5 px-3 focus:text-foreground"
            >
              <Save className="w-4 h-4 mr-2" />
              Add to Template
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                try {
                  await handleDeleteEntry(entry.id);
                } catch (error) {
                  console.error('Error deleting entry:', error);
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
        
        {/* Entry Image */}
        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
          {entry.image_url ? (
            <SmartImage 
              imageUrl={entry.image_url} 
              alt={entry.name}
              className="w-10 h-10 object-cover rounded-lg"
              fallback={<Utensils className="w-5 h-5 text-muted-foreground" />}
            />
          ) : (
            <Utensils className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        
        {/* Entry Content */}
        <div className="flex-1 min-w-0 relative">
          <div className="mb-0 flex items-center gap-2 min-w-0">
            <ClickableTooltip content={entry.name}>
              <h3 className={`text-sm font-semibold truncate max-w-[180px] ${
                entry.consumed ? 'text-muted-foreground line-through' : 'text-foreground'
              }`}>
                {entry.name}
              </h3>
            </ClickableTooltip>
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
              <span className="cursor-pointer">{Math.round(entry.carbs)}g</span>
            </ClickableTooltip>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="default"
            onClick={() => handleToggleConsumption(entry.id, !entry.consumed)}
            className={`h-5 w-5 p-1 rounded ${
              entry.consumed 
                ? 'bg-muted/50 hover:bg-muted/70 text-muted-foreground' 
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
            title={entry.consumed ? "Mark as not eaten" : "Mark as eaten"}
            aria-label={entry.consumed ? "Mark as not eaten" : "Mark as eaten"}
          >
            {entry.consumed ? (
              <X className="w-3 h-3" />
            ) : (
              <Check className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <AccessGate feature="food">
      {({ hasAccess, requestUpgrade }) => 
        hasAccess ? (
          <div className="relative min-h-[calc(100vh-80px)] bg-background p-4 overflow-x-hidden">
        <div className="max-w-md mx-auto pt-10 pb-40 safe-bottom">
              {/* Header with Responsive Page Header */}
              <ResponsivePageHeader
                title="Food Tracking"
                subtitle="Track your food intake"
                onHistoryClick={() => navigate('/food-history')}
                historyTitle="View food history"
                onMyFoodsClick={() => navigate('/my-foods')}
                myFoodsTitle="Browse food library"
                onFoodAdded={handleTextInput}
                showAuthorTooltip={true}
                authorTooltipContentKey="food_tracking_insights"
                authorTooltipContent="Proper nutrition tracking helps you understand your body's needs, maintain consistent energy levels, and develop sustainable eating habits. Focus on nutrient density rather than just calories!"
              />

              {/* Food Statistics Card */}
              <div className="mb-6">
                <ComponentErrorBoundary>
                  <FoodStatsCard entries={todayEntries} />
                </ComponentErrorBoundary>
              </div>

              {/* Action Buttons - Two Column Layout */}
              <div className="mb-6 grid grid-cols-2 gap-6">
                <div className="flex flex-col items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DirectPhotoCaptureButton onFoodAdded={handlePhotoCapture} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Take a photo to automatically detect food and nutrition</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-xs text-muted-foreground text-center">Add with photo</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DirectVoiceFoodInput onFoodAdded={handleVoiceInput} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Speak to add foods using voice recognition</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-xs text-muted-foreground text-center">Add with voice</span>
                </div>
              </div>

              {/* Food Entries List */}
              <div className="mb-6">
                {todayEntries.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 space-y-2">
                    <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p>No foods added yet</p>
                    <p className="text-sm mt-2">Add foods using the buttons above</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {/* Sort entries so consumed items appear at the bottom */}
                    {[...todayEntries].sort((a, b) => {
                      if (a.consumed && !b.consumed) return 1;
                      if (!a.consumed && b.consumed) return -1;
                      return 0;
                    }).map((entry) => 
                      renderFoodEntryCard(entry)
                    )}
                    
                    {/* Action Buttons */}
                    {todayEntries.length > 0 && (
                      <div className="flex justify-between items-center mt-6 pt-2 gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSaveToTemplateDialog(true)}
                          className="text-primary hover:bg-primary/10 text-xs px-3 py-2 h-auto flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Save to Template
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowClearAllDialog(true)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs px-3 py-2 h-auto"
                          disabled={isClearingAll}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleMarkAllAsEaten}
                          className="text-green-600 hover:bg-green-50 hover:text-green-700 text-xs px-3 py-2 h-auto"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modals */}
            <TooltipProvider>
              {/* Edit Food Entry Modal */}
              {editingEntry && (
                <EditFoodEntryModal
                  entry={editingEntry}
                  onUpdate={async (updatedEntry) => {
                    try {
                      await updateFoodEntry({ 
                        id: editingEntry.id, 
                        updates: updatedEntry 
                      });
                      setEditingEntry(null);
                    } catch (error) {
                      console.error('Error updating entry:', error);
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to update food entry"
                      });
                    }
                  }}
                  isOpen={true}
                  onClose={() => setEditingEntry(null)}
                />
              )}


              {/* Page Onboarding Modal */}
              {showOnboarding && onboardingContent.food_tracking && (
                <PageOnboardingModal
                  isOpen={showOnboarding}
                  onClose={() => setShowOnboarding(false)}
                  title={onboardingContent.food_tracking.title || "Food Tracking"}
                  subtitle={onboardingContent.food_tracking.subtitle}
                  heroQuote={onboardingContent.food_tracking.heroQuote}
                  backgroundImage={onboardingContent.food_tracking.backgroundImage}
                >
                  <div></div>
                </PageOnboardingModal>
              )}

              <ConfirmationModal
                isOpen={showClearAllDialog}
                onClose={() => setShowClearAllDialog(false)}
                onConfirm={handleClearAll}
                title="Clear All Foods"
                description="Are you sure you want to remove all food entries for today? This action cannot be undone."
                confirmText="Clear All"
                cancelText="Cancel"
                variant="destructive"
                isLoading={isClearingAll}
              />

        {/* Save to Template Confirmation Modal */}
        <ConfirmationModal
          isOpen={showSaveToTemplateDialog}
          onClose={() => setShowSaveToTemplateDialog(false)}
          onConfirm={handleSaveToTemplateConfirm}
          title="Save All Foods to Template"
          description={`This will add all ${todayEntries.length} food${todayEntries.length > 1 ? 's' : ''} from today's list to your daily template, including both eaten and non-eaten items. You can reuse this template to quickly add all your favorite foods on other days.`}
          confirmText="Save to Template"
          cancelText="Cancel"
        />
            </TooltipProvider>
          </div>
        ) : (
          <div className="relative min-h-[calc(100vh-80px)] bg-background p-4 overflow-x-hidden">
            <div className="max-w-md mx-auto pt-10 pb-32 safe-bottom">
              {/* Header */}
              <ResponsivePageHeader
                title="Food Tracking"
                subtitle="Track your food intake"
                onHistoryClick={() => {}}
                historyTitle=""
                onMyFoodsClick={() => {}}
                myFoodsTitle=""
                showAuthorTooltip={false}
              />

              {/* Locked State Card */}
              <div className="mb-6">
                <div className="p-4 text-center relative overflow-hidden min-h-[180px] bg-card/50 rounded-lg">
                  <div className="flex flex-col justify-center items-center h-full space-y-4 opacity-50">
                    <div className="grid grid-cols-2 gap-4 w-full mb-4">
                      <div className="text-center">
                        <div className="text-4xl font-mono font-bold text-muted-foreground mb-1">0</div>
                        <div className="text-xs text-muted-foreground">calories</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-mono font-bold text-muted-foreground mb-1">0</div>
                        <div className="text-xs text-muted-foreground">g carbs</div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Locked Action Buttons */}
              <div className="mb-6 grid grid-cols-2 gap-6 opacity-50">
                <div className="flex flex-col items-center gap-1">
                  <Button size="start-button" disabled className="w-full">
                    📷
                  </Button>
                  <span className="text-xs text-muted-foreground">Photo</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Button size="start-button" disabled className="w-full">
                    🎤
                  </Button>
                  <span className="text-xs text-muted-foreground">Voice</span>
                </div>
              </div>

              {/* Premium Upgrade Prompt */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-6 text-center border border-primary/20">
                <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Unlock Food Tracking</h3>
                <p className="text-muted-foreground mb-4">
                  Track your nutrition, calories, and reach your health goals with premium food tracking features.
                </p>
                <Button 
                  onClick={requestUpgrade}
                  className="w-full"
                  size="lg"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Button>
              </div>
            </div>
          </div>
        ) 
      }
    </AccessGate>
  );
};

export default FoodTracking;