import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Utensils, MoreVertical, Check, BookOpen, Lock, Crown } from 'lucide-react';
import { convertToGrams } from '@/utils/foodConversions';
import { DirectVoiceFoodInput } from '@/components/DirectVoiceFoodInput';
import { DirectPhotoCaptureButton } from '@/components/DirectPhotoCaptureButton';
import { HistoryButton } from '@/components/HistoryButton';
import { PageOnboardingModal } from '@/components/PageOnboardingModal';
import { onboardingContent } from '@/data/onboardingContent';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { FoodHistory } from '@/components/FoodHistory';
import { EditFoodEntryModal } from '@/components/EditFoodEntryModal';
import { UnifiedFoodEntry } from '@/components/UnifiedFoodEntry';
import { ComponentErrorBoundary } from '@/components/ErrorBoundary';
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

const FoodTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [consumedNow, setConsumedNow] = useState(true);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showUnifiedEntry, setShowUnifiedEntry] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const { execute: executeClearAll, isLoading: isClearingAll } = useStandardizedLoading();
  const { profile, updateProfile } = useProfile();
  const { hasAccess, hasPremiumFeatures, isAdmin } = useAccess();
  const isSubscriptionActive = hasAccess || hasPremiumFeatures;
  const { todayEntries, addFoodEntry, addMultipleFoodEntries, deleteFoodEntry, updateFoodEntry, toggleConsumption, clearAllEntries, refreshFoodEntries } = useFoodEntriesQuery();
  const { calculateWalkingMinutesForFood, formatWalkingTime } = useFoodWalkingCalculation();

  // Close modals when navigating to auth routes to prevent OAuth interaction errors
  useEffect(() => {
    if (location.pathname === '/auth' || location.pathname === '/auth-callback') {
      setShowHistory(false);
      setShowUnifiedEntry(false);
      setShowOnboarding(false);
    }
  }, [location.pathname]);

  const handlePhotoCapture = (data: any) => {
    if (data.requiresManualEntry) {
      // Navigate to manual entry with the uploaded image
      navigate('/add-food', { state: { imageUrl: data.image_url } });
    } else {
      // Direct food data from AI analysis
      handleSaveUnifiedEntry(data);
    }
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
    const result = await executeClearAll(async () => {
      clearAllEntries();

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
      
      return true;
    }, {
      onSuccess: () => {
        toast({
          title: "All Foods Cleared",
          description: "All food entries for today have been removed"
        });
        setShowClearAllDialog(false);
      },
      onError: async (error) => {
        console.error('Error clearing foods:', error);
        await refreshFoodEntries();
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to clear food entries"
        });
      }
    });
  };

  return (
    <AccessGate feature="food">
      {({ hasAccess, requestUpgrade }) => 
        hasAccess ? (
          <div className="relative min-h-[calc(100vh-80px)] bg-background p-4 overflow-x-hidden">
            <div className="max-w-md mx-auto pt-10 pb-32 safe-bottom">
              {/* Header with Responsive Page Header */}
              <ResponsivePageHeader
                title="Food Tracking"
                subtitle="Track your food intake"
                onHistoryClick={() => navigate('/food-history')}
                historyTitle="View food history"
                showAuthorTooltip={true}
                authorTooltipContentKey="food_tracking_insights"
                authorTooltipContent="Proper nutrition tracking helps you understand your body's needs, maintain consistent energy levels, and develop sustainable eating habits. Focus on nutrient density rather than just calories!"
              />

              {/* Food Statistics Card */}
              <div className="mb-6">
                <ComponentErrorBoundary>
                  <FoodStatsCard 
                    entries={todayEntries} 
                    onClearAll={() => setShowClearAllDialog(true)}
                  />
                </ComponentErrorBoundary>
              </div>

              {/* Action Buttons - Three Column Layout */}
              <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="col-span-1 flex flex-col items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DirectPhotoCaptureButton onFoodAdded={handlePhotoCapture} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Take a photo to automatically detect food and nutrition</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-xs text-muted-foreground">Add Food</span>
                </div>

                <div className="col-span-1 flex flex-col items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DirectVoiceFoodInput onFoodAdded={handleSaveUnifiedEntry} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Use voice to add food with AI assistance</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-xs text-muted-foreground">Add Food</span>
                </div>

                <div className="col-span-1 flex flex-col items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="action-secondary"
                        size="action-tall"
                        className="w-full flex items-center justify-center"
                        onClick={() => navigate('/my-foods')}
                        aria-label="Browse food library"
                      >
                        <BookOpen className="w-11 h-11" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Browse and select from your saved food library</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-xs text-muted-foreground">My Foods</span>
                </div>
              </div>


              {/* Food List */}
              <div className="space-y-6">
                <div className="mt-4">
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
                            
                            {/* More Options Menu */}
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
                                  onClick={async () => {
                                    try {
                                      await handleDeleteFoodEntry(entry.id);
                                    } catch (error) {
                                      console.error('Error deleting food entry:', error);
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
                                <img 
                                  src={entry.image_url} 
                                  alt={entry.name}
                                  className="w-10 h-10 object-cover rounded-lg"
                                />
                              ) : (
                                <Utensils className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            
                            {/* Entry Content */}
                            <div className="flex-1 min-w-0 relative">
                              <div className="mb-0 flex items-center gap-2 min-w-0">
                                <h3 className={`text-sm font-semibold truncate max-w-[180px] ${
                                  entry.consumed ? 'text-muted-foreground line-through' : 'text-foreground'
                                }`}>
                                  {entry.name}
                                </h3>
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
                            
                            {/* Actions */}
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
                </div>
              </div>
            </div>

            {/* Modals */}
            <TooltipProvider>
              {/* Edit Food Entry Modal */}
              {editingEntry && (
                <EditFoodEntryModal
                  entry={editingEntry}
                  isOpen={!!editingEntry}
                  onClose={() => setEditingEntry(null)}
                  onUpdate={async (updatedEntry) => {
                    try {
                      await updateFoodEntry({
                        id: updatedEntry.id,
                        updates: {
                          name: updatedEntry.name,
                          calories: updatedEntry.calories,
                          carbs: updatedEntry.carbs,
                          serving_size: updatedEntry.serving_size,
                          image_url: updatedEntry.image_url
                        }
                      });
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

              {/* Unified Food Entry Modal */}
              <UnifiedFoodEntry 
                isOpen={showUnifiedEntry}
                onClose={() => setShowUnifiedEntry(false)}
                onSave={handleSaveUnifiedEntry}
              />

              {/* Food History - Direct component, not a modal */}
              {showHistory && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
                    <FoodHistory 
                      onClose={() => setShowHistory(false)}
                      onCopySuccess={() => {
                        setShowHistory(false);
                        toast({
                          title: "Foods Copied",
                          description: "Foods have been added to today"
                        });
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Page Onboarding Modal */}
              <PageOnboardingModal
                isOpen={showOnboarding}
                onClose={() => setShowOnboarding(false)}
                {...onboardingContent.foodTracking}
              >
                <div>Onboarding content</div>
              </PageOnboardingModal>
            </TooltipProvider>

        {/* Clear All Confirmation Dialog */}
        <ConfirmationModal
          isOpen={showClearAllDialog}
          onClose={() => setShowClearAllDialog(false)}
          onConfirm={handleClearAllEntries}
          title="Clear All Foods?"
          description="This will remove all food entries for today. This action cannot be undone."
          confirmText="Clear All"
          variant="destructive"
          isLoading={isClearingAll}
        />
          </div>
        ) : (
          <div className="relative min-h-[calc(100vh-80px)] bg-background p-4 overflow-x-hidden">
            <div className="max-w-md mx-auto pt-10 pb-32 safe-bottom">
              {/* Locked State */}
              <div className="pointer-events-none opacity-20 select-none">
                {/* Header with Responsive Page Header */}
                <ResponsivePageHeader
                  title="Food Tracking"
                  subtitle="Track your food intake"
                  onHistoryClick={() => {}}
                  historyTitle="View food history"
                  showAuthorTooltip={false}
                />

                {/* Action Buttons - Locked */}
                <div className="mb-6 grid grid-cols-3 gap-4">
                  <div className="col-span-1 flex flex-col items-center gap-1">
                    <Button 
                      variant="action-secondary"
                      size="action-tall"
                      className="w-full flex items-center justify-center"
                      disabled
                    >
                      <Lock className="w-11 h-11" />
                    </Button>
                    <span className="text-xs text-muted-foreground">Add Food</span>
                  </div>

                  <div className="col-span-1 flex flex-col items-center gap-1">
                    <Button 
                      variant="action-secondary"
                      size="action-tall"
                      className="w-full flex items-center justify-center"
                      disabled
                    >
                      <Lock className="w-11 h-11" />
                    </Button>
                    <span className="text-xs text-muted-foreground">Add Food</span>
                  </div>

                  <div className="col-span-1 flex flex-col items-center gap-1">
                    <Button 
                      variant="action-secondary"
                      size="action-tall"
                      className="w-full flex items-center justify-center"
                      disabled
                    >
                      <Lock className="w-11 h-11" />
                    </Button>
                    <span className="text-xs text-muted-foreground">My Foods</span>
                  </div>
                </div>

                {/* Mock Summary */}
                <div className="bg-muted p-3 rounded-md mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Today: 0 kcal</span>
                    </div>
                  </div>
                </div>

                {/* Empty state */}
                <div className="text-center py-8 text-muted-foreground">
                  <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p>No foods added yet</p>
                  <p className="text-sm mt-2">Add foods using the buttons above</p>
                </div>
              </div>

              {/* Premium Upgrade Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="text-center p-6 bg-card rounded-2xl border border-border shadow-lg max-w-sm mx-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Premium Feature</h2>
                  <p className="text-muted-foreground mb-6">
                    Food tracking requires a premium subscription to access AI-powered photo and voice analysis.
                  </p>
                  <Button 
                    onClick={requestUpgrade}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </AccessGate>
  );
};

export default FoodTracking;