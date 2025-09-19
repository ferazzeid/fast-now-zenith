import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Utensils, MoreVertical, Check, X, BookOpen, Lock, Crown, Save, Keyboard, Copy } from 'lucide-react';
import { convertToGrams } from '@/utils/foodConversions';
import { truncateFoodName } from '@/utils/textUtils';
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
import { ManualFoodEntryModal } from '@/components/ManualFoodEntryModal';
import { PremiumFoodModal } from '@/components/PremiumFoodModal';

const FoodTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [consumedNow, setConsumedNow] = useState(true);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [showSaveToTemplateDialog, setShowSaveToTemplateDialog] = useState<boolean | any>(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const { execute: executeClearAll, isLoading: isClearingAll } = useStandardizedLoading();
  const { profile, updateProfile } = useProfile();
  const { hasAccess, hasPremiumFeatures, hasAIAccess, isAdmin } = useAccess();
  const isSubscriptionActive = hasAccess || hasPremiumFeatures;
  
  // Debug access state
  console.log('Access Debug:', { hasAccess, hasPremiumFeatures, hasAIAccess, isAdmin, isSubscriptionActive });
  const { todayEntries, addFoodEntry, addMultipleFoodEntries, deleteFoodEntry, updateFoodEntry, toggleConsumption, bulkMarkAsEaten, clearAllEntries, refreshFoodEntries, isBulkMarking } = useFoodEntriesQuery();
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
      setShowManualEntryModal(false);
      setShowPremiumModal(false);
    }
  }, [location.pathname]);

  const handlePhotoCapture = async (foods: any[]) => {
    try {
      if (foods && foods.length > 0) {
        await addMultipleFoodEntries(foods);
        // Toast is already shown by DirectPhotoCaptureButton
      }
    } catch (error) {
      console.error('Error adding foods from photo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add foods from photo"
      });
    }
  };

  const handleSaveToTemplateConfirm = async () => {
    try {
      // Check if saving individual item or all items
      const isIndividualSave = typeof showSaveToTemplateDialog === 'object' && showSaveToTemplateDialog !== null;
      
      let foodsToSave;
      if (isIndividualSave) {
        // Save single item
        const entry = showSaveToTemplateDialog;
        foodsToSave = [{
          name: entry.name,
          calories: entry.calories,
          carbs: entry.carbs,
          serving_size: entry.serving_size,
          image_url: entry.image_url
        }];
      } else {
        // Save all items
        foodsToSave = todayEntries.map(entry => ({
          name: entry.name,
          calories: entry.calories,
          carbs: entry.carbs,
          serving_size: entry.serving_size,
          image_url: entry.image_url
        }));
      }
      
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

  const handleManualInput = () => {
    setShowManualEntryModal(true);
  };

  const handleManualFoodAdded = async (foodEntry: any) => {
    try {
      await addFoodEntry(foodEntry);
      // Toast is handled by the modal
    } catch (error) {
      console.error('Error adding manual food entry:', error);
      throw error; // Let the modal handle the error
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
      // Use bulk operation for immediate UI update and single database call
      const entryIds = uneatenEntries.map(entry => entry.id);
      bulkMarkAsEaten(entryIds);
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
                    consumed: false,
                    // Preserve nutritional intelligence data
                    calories_per_100g: entry.calories_per_100g,
                    carbs_per_100g: entry.carbs_per_100g,
                    protein_per_100g: entry.protein_per_100g,
                    fat_per_100g: entry.fat_per_100g,
                    calories_manually_set: entry.calories_manually_set,
                    carbs_manually_set: entry.carbs_manually_set,
                    protein_manually_set: entry.protein_manually_set,
                    fat_manually_set: entry.fat_manually_set,
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
              className="py-2.5 px-3 focus:text-foreground"
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
              <h3 className={`text-sm font-semibold ${
                entry.consumed ? 'text-muted-foreground line-through' : 'text-foreground'
              }`}>
                {truncateFoodName(entry.name)}
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
                : 'bg-accent hover:bg-muted/30 text-white hover:text-accent'
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
          onManualInput={handleManualInput}
          manualInputTitle="Manual food entry"
          showAuthorTooltip={false}
        />

        {/* Food Statistics Card */}
        <div className="mb-6 relative">
          <ComponentErrorBoundary>
            <FoodStatsCard entries={todayEntries} />
          </ComponentErrorBoundary>
        </div>

        {/* Action Buttons - Two Column Layout */}
        <div className="mb-6 grid grid-cols-2 gap-6">
          {hasAIAccess ? (
            // Premium Mode: Keep existing buttons exactly as they are
            <>
              <div className="flex flex-col items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <ComponentErrorBoundary>
                        <DirectPhotoCaptureButton
                          onFoodAdded={handlePhotoCapture}
                          className="w-full h-16"
                        />
                      </ComponentErrorBoundary>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Add food by taking a photo
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <ComponentErrorBoundary>
                        <DirectVoiceFoodInput 
                          onFoodAdded={handleVoiceInput}
                        />
                      </ComponentErrorBoundary>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Add food by voice description
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          ) : (
            // Free Mode: Manual input replaces photo, Premium placeholder replaces voice
            <>
              <div className="flex flex-col items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Button
                        onClick={handleManualInput}
                        variant="action-secondary"
                        size="start-button"
                        className="w-full flex items-center justify-center transition-colors"
                      >
                        <div className="flex items-center space-x-1">
                          <Plus className="w-6 h-6" />
                          <Keyboard className="w-12 h-12" />
                        </div>
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Type food details manually
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-full">
                  <Button
                    onClick={() => setShowPremiumModal(true)}
                    variant="action-secondary"
                    size="start-button"
                    className="w-full flex items-center justify-center transition-colors opacity-50 cursor-pointer hover:opacity-70"
                  >
                    <div className="flex items-center space-x-1">
                      <Plus className="w-6 h-6" />
                      <Lock className="w-12 h-12" />
                    </div>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Food Entries List */}
        <div className="space-y-2 mb-6">
          {todayEntries.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Utensils className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No foods logged today</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start tracking your food to see your daily nutrition
              </p>
            </div>
          ) : (
            todayEntries.map(renderFoodEntryCard)
          )}
        </div>

        {/* Bulk Actions - Show only when there are entries */}
        {todayEntries.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => setShowSaveToTemplateDialog(true)}
                variant="ghost"
                size="sm"
                className="w-10 h-10 p-0 rounded-lg hover:bg-muted text-foreground"
                title="Save to Template"
              >
                <Copy className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => setShowClearAllDialog(true)}
                variant="ghost"
                size="sm"
                className="w-10 h-10 p-0 rounded-lg hover:bg-muted text-red-500 hover:text-red-600"
                title="Clear All"
                disabled={isClearingAll}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleMarkAllAsEaten}
                variant="ghost"
                size="sm"
                className="w-10 h-10 p-0 rounded-lg hover:bg-muted text-green-500 hover:text-green-600"
                title={isBulkMarking ? 'Marking...' : 'Mark All Eaten'}
                disabled={isBulkMarking}
              >
                <Check className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      {showOnboarding && (
        <PageOnboardingModal
          isOpen={showOnboarding}
          onClose={() => {
            setShowOnboarding(false);
            updateProfile({ enable_food_slideshow: false });
          }}
          title={onboardingContent.food.title}
        >
          <div className="p-6">
            <p className="text-muted-foreground mb-4">Welcome to food tracking! Here you can log your meals and track your nutrition.</p>
            <Button 
              onClick={() => {
                setShowOnboarding(false);
                updateProfile({ enable_food_slideshow: false });
              }}
              className="w-full"
            >
              Get Started
            </Button>
          </div>
        </PageOnboardingModal>
      )}
      
      <ConfirmationModal
        isOpen={showClearAllDialog}
        onClose={() => setShowClearAllDialog(false)}
        onConfirm={handleClearAll}
        title="Clear All Foods"
        description="Are you sure you want to remove all food entries for today? This action cannot be undone."
        isLoading={isClearingAll}
      />
      
      <ConfirmationModal
        isOpen={!!showSaveToTemplateDialog}
        onClose={() => setShowSaveToTemplateDialog(false)}
        onConfirm={handleSaveToTemplateConfirm}
        title="Save to Template"
        description={
          typeof showSaveToTemplateDialog === 'object' && showSaveToTemplateDialog !== null
            ? `Add "${showSaveToTemplateDialog.name}" to your daily template?`
            : `Add all ${todayEntries.length} food${todayEntries.length > 1 ? 's' : ''} to your daily template?`
        }
      />
      
      {editingEntry && (
        <EditFoodEntryModal
          isOpen={!!editingEntry}
          onClose={() => setEditingEntry(null)}
          entry={editingEntry}
          onUpdate={async (updatedEntry) => {
            try {
              await updateFoodEntry({ id: updatedEntry.id, updates: updatedEntry });
              setEditingEntry(null);
              toast({
                title: "Food Updated",
                description: "Food entry has been updated successfully"
              });
            } catch (error) {
              console.error('Error updating food entry:', error);
              toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update food entry"
              });
            }
          }}
        />
      )}
      
      {showPremiumModal && (
        <PremiumFoodModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
        />
      )}
      
      {showManualEntryModal && (
        <ManualFoodEntryModal
          isOpen={showManualEntryModal}
          onClose={() => setShowManualEntryModal(false)}
          onFoodAdded={handleManualFoodAdded}
        />
      )}
    </div>
  );
};

export default FoodTracking;