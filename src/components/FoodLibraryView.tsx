import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Heart, Search, Trash2, Edit, Plus, ShoppingCart, Check, ArrowLeft, Star, MoreVertical, Download, X, Utensils, Clock, Save, Database, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  ConfirmationModal
} from '@/components/ui/universal-modal';
import { EditDefaultFoodModal } from '@/components/EditDefaultFoodModal';
import { SmartImage } from '@/components/SmartImage';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRecentFoods } from '@/hooks/useRecentFoods';
import { useFoodContext } from '@/hooks/useFoodContext';
import { useAuth } from '@/hooks/useAuth';
import { useStaticDefaultFoods } from '@/hooks/useStaticDefaultFoods';
import { DatabaseErrorBoundary } from '@/components/enhanced/DatabaseErrorBoundary';

interface UserFood {
  id: string;
  name: string;
  calories_per_100g: number;
  carbs_per_100g: number;
  is_favorite: boolean;
  image_url?: string;
  variations: any;
}

interface DefaultFood {
  id: string;
  name: string;
  calories_per_100g: number;
  carbs_per_100g: number;
  image_url?: string;
  is_favorite?: boolean;
}

interface TemplateFood {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  serving_size: number;
  image_url?: string;
}

interface FoodLibraryViewProps {
  onSelectFood: (food: UserFood, consumed?: boolean) => void;
  onBack: () => void;
  // Template functionality props
  templateFoods?: TemplateFood[];
  templateLoading?: boolean;
  onSaveAsTemplate?: (foods: any[]) => Promise<any>;
  onAddToTemplate?: (foods: any[], insertAfterIndex?: number) => Promise<any>;
  onClearTemplate?: () => Promise<any>;
  onApplyTemplate?: () => Promise<any>;
  onDeleteTemplateFood?: (foodId: string) => Promise<any>;
  onForceLoadTemplate?: () => Promise<void>;
}

export const FoodLibraryView = ({ 
  onSelectFood, 
  onBack,
  templateFoods = [],
  templateLoading = false,
  onSaveAsTemplate,
  onAddToTemplate,
  onClearTemplate,
  onApplyTemplate,
  onDeleteTemplateFood,
  onForceLoadTemplate
}: FoodLibraryViewProps) => {
  const location = useLocation();
  const { user, loading } = useAuth();

  // IMMEDIATE: Don't render anything if on auth routes to prevent interactions
  if (location.pathname === '/auth' || location.pathname === '/auth-callback') {
    return null;
  }

  // Use recent foods hook for "My Foods" tab
  const { recentFoods, loading: recentFoodsLoading, refreshRecentFoods } = useRecentFoods();
  
  // Use static default foods for instant access
  const { defaultFoods: staticDefaultFoods } = useStaticDefaultFoods();
  
  const [defaultFoods, setDefaultFoods] = useState<DefaultFood[]>([]);
  const [defaultFoodFavorites, setDefaultFoodFavorites] = useState<Set<string>>(new Set());
  const [myFoodFavorites, setMyFoodFavorites] = useState<Set<string>>(new Set()); // Same pattern as defaultFoodFavorites
  const [searchTerm, setSearchTerm] = useState('');
  const [defaultFoodsLoading, setDefaultFoodsLoading] = useState(false); // No longer needed with static data
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-foods' | 'template' | 'suggested'>('my-foods');
  const [showClearTemplateDialog, setShowClearTemplateDialog] = useState(false);
  const [showApplyTemplateDialog, setShowApplyTemplateDialog] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showDeleteDefaultFoodConfirm, setShowDeleteDefaultFoodConfirm] = useState(false);
  const [defaultFoodToDelete, setDefaultFoodToDelete] = useState<DefaultFood | null>(null);
  
  // Remove complex optimistic favorites - use simple state like Default tab

  // Prevent interactions during loading states
  const isInteractionSafe = !loading;
  const { toast } = useToast();
  
  // Combined loading state (no longer includes default foods loading)
  const isLoading = recentFoodsLoading;

  // Set default foods from static data immediately
  useEffect(() => {
    setDefaultFoods(staticDefaultFoods);
  }, [staticDefaultFoods]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          loadDefaultFoodFavorites(),
          loadMyFoodFavorites(), // Load my food favorites like default food favorites
          checkAdminRole()
        ]);
      } finally {
        // No longer need to set loading state
      }
    };
    
    if (user) {
      loadData();
    }
  }, [user]);

  // Remove optimistic update timeout - not needed with simple state pattern

  const checkAdminRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('is_current_user_admin');
      
      if (error) throw error;
      setIsAdmin(data || false);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    }
  };

  // Convert recent foods to UserFood format for compatibility
  const foods: UserFood[] = useMemo(() => {
    console.log('🔥 FOODS MEMO - Raw recentFoods:', recentFoods.map(f => ({ name: f.name, id: f.id, is_favorite: f.is_favorite })));
    console.log('🔥 FOODS MEMO - myFoodFavorites Set:', Array.from(myFoodFavorites));
    
    const result = recentFoods.map(food => ({
      id: food.id,
      name: food.name,
      calories_per_100g: food.calories_per_100g,
      carbs_per_100g: food.carbs_per_100g,
      // Use myFoodFavorites Set as source of truth (same pattern as defaultFoodFavorites)
      is_favorite: myFoodFavorites.has(food.id),
      image_url: food.image_url,
      variations: []
    }));
    
    console.log('🔥 FOODS MEMO - Final foods for UI:', result.map(f => ({ name: f.name, id: f.id, is_favorite: f.is_favorite })));
    return result;
  }, [recentFoods, myFoodFavorites]); // Use myFoodFavorites instead of optimisticFavorites

  // Remove old loadDefaultFoods function - now using static data

  const loadMyFoodFavorites = async () => {
    if (!user) return;
    
    console.log('🔥 MY FOOD FAVORITES - Loading favorites from database');
    try {
      const { data, error } = await supabase
        .from('user_foods')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_favorite', true);

      if (error) throw error;
      
      const favoriteIds = new Set(data?.map(food => food.id) || []);
      console.log('🔥 MY FOOD FAVORITES - Loaded favorite IDs:', Array.from(favoriteIds));
      setMyFoodFavorites(favoriteIds);
    } catch (error) {
      console.error('🔥 MY FOOD FAVORITES - Error loading favorites:', error);
    }
  };

  const loadDefaultFoodFavorites = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('default_food_favorites')
        .select('default_food_id')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const favoriteIds = new Set(data?.map(fav => fav.default_food_id) || []);
      setDefaultFoodFavorites(favoriteIds);
    } catch (error) {
      console.error('Error loading default food favorites:', error);
    }
  };

  const handleQuickSelect = async (food: UserFood | DefaultFood, consumed: boolean = false) => {
    if (!isInteractionSafe) {
      toast({
        title: "Please wait",
        description: "System is loading, please try again in a moment"
      });
      return;
    }
    
    // Adding food to today
    
    const userFood = 'variations' in food ? food : {
      ...food,
      is_favorite: false,
      variations: []
    } as UserFood;
    
    // Let React Query handle loading states and errors
    await onSelectFood(userFood, consumed);
  };

  const handleAddToTemplate = async (food: UserFood | DefaultFood) => {
    if (!user || !onAddToTemplate) return;
    
    if (!isInteractionSafe) {
      toast({
        title: "Please wait",
        description: "System is loading, please try again in a moment"
      });
      return;
    }
    
    try {
      const foodToAdd = [{
        name: food.name,
        calories: food.calories_per_100g,
        carbs: food.carbs_per_100g,
        serving_size: 100,
        image_url: food.image_url
      }];
      
      const result = await onAddToTemplate(foodToAdd);
      
      if (!result?.error) {
        toast({
          title: "Added to template",
          description: `${food.name} has been added to your daily template`,
        });
      } else {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('🍽️ FoodLibrary - handleAddToTemplate failed:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add food to template"
      });
    }
  };


  const toggleFavorite = async (foodId: string, currentFavorite: boolean) => {
    console.log('❤️ FoodLibrary - toggleFavorite started:', { 
      foodId, 
      currentFavorite,
      user: user ? { id: user.id, email: user.email } : null
    });

    if (!user?.id) {
      console.error('❤️ FoodLibrary - No user found');
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Please log in to manage favorites"
      });
      return;
    }

    // Check if we can perform database operations
    if (!isInteractionSafe) {
      // Database not ready, showing loading state
      toast({
        title: "Please wait",
        description: "System is loading, please try again in a moment"
      });
      return;
    }

    console.log('❤️ MY FOODS FAVORITE - Toggling favorite:', { foodId, currentFavorite });

    try {
      // Update database
      const { data, error } = await supabase
        .from('user_foods')
        .update({ is_favorite: !currentFavorite })
        .eq('id', foodId)
        .eq('user_id', user.id)
        .select('id, name, is_favorite')
        .single();

      if (error) throw error;

      // Update local state immediately (same pattern as toggleDefaultFoodFavorite)
      setMyFoodFavorites(prev => {
        const newSet = new Set(prev);
        if (currentFavorite) {
          newSet.delete(foodId);
          console.log('❤️ MY FOODS FAVORITE - Removed from favorites:', foodId);
        } else {
          newSet.add(foodId);
          console.log('❤️ MY FOODS FAVORITE - Added to favorites:', foodId);
        }
        return newSet;
      });

      console.log('❤️ MY FOODS FAVORITE - Update successful:', data);
      
    } catch (error) {
      console.error('❤️ MY FOODS FAVORITE - Update failed:', error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update favorite. Please try again."
      });
    }
  };

  const toggleDefaultFoodFavorite = async (foodId: string, isFavorite: boolean) => {
    if (!user) return;
    
    if (!isInteractionSafe) {
      toast({
        title: "Please wait",
        description: "System is loading, please try again in a moment"
      });
      return;
    }
    
    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('default_food_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('default_food_id', foodId);

        if (error) throw error;

        setDefaultFoodFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(foodId);
          return newSet;
        });
      } else {
        const { error } = await supabase
          .from('default_food_favorites')
          .insert({
            user_id: user.id,
            default_food_id: foodId
          });

        if (error) throw error;

        setDefaultFoodFavorites(prev => new Set([...prev, foodId]));
      }
    } catch (error) {
      console.error('Error updating default food favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite",
        variant: "destructive"
      });
    }
  };

  const updateFood = async (foodId: string, updates: Partial<UserFood>) => {
    console.log('🍽️ FoodLibrary - updateFood called with:', { foodId, updates });
    
    if (loading) {
      throw new Error('Database not ready');
    }
    
    try {
      const { data, error } = await supabase
        .from('user_foods')
        .update(updates)
        .eq('id', foodId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) {
        console.error('🍽️ FoodLibrary - updateFood error:', error);
        throw error;
      }

      console.log('🍽️ FoodLibrary - updateFood success:', data);

      // Refresh recent foods to show the updated food
      await refreshRecentFoods();

      console.log('🍽️ FoodLibrary - food updated in local state');
    } catch (error) {
      console.error('🍽️ FoodLibrary - updateFood failed:', error);
      throw error;
    }
  };

  const deleteFood = async (foodId: string) => {
    console.log('🍽️ FoodLibrary - deleteFood called with:', { foodId });
    
    if (loading) {
      toast({
        title: "Please wait",
        description: "System is loading, please try again in a moment"
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_foods')
        .delete()
        .eq('id', foodId)
        .eq('user_id', user?.id)
        .select();

      if (error) {
        console.error('🍽️ FoodLibrary - deleteFood error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('🍽️ FoodLibrary - No rows were deleted');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Food not found or already deleted"
        });
        return;
      }

      console.log('🍽️ FoodLibrary - deleteFood success:', data);

      // Refresh recent foods to show the updated library
      await refreshRecentFoods();
      
      toast({
        title: "Food removed",
        description: "Food has been removed from your library"
      });
    } catch (error) {
      console.error('🍽️ FoodLibrary - deleteFood failed:', error);
      toast({
        title: "Error",
        description: "Failed to remove food",
        variant: "destructive"
      });
    }
  };

  const deleteAllUserFoods = async () => {
    if (!user) return;
    
    if (loading) {
      toast({
        title: "Please wait",
        description: "System is loading, please try again in a moment"
      });
      return;
    }
    
    try {
      console.log('🍽️ FoodLibrary - Starting delete all foods operation');
      
      // Clear confirmation dialog
      setShowDeleteAllConfirm(false);
      
      // Delete both user library foods AND all food entries (recent foods)
      const [userFoodsResult, foodEntriesResult] = await Promise.all([
        supabase
          .from('user_foods')
          .delete()
          .eq('user_id', user.id),
        supabase
          .from('food_entries')
          .delete()
          .eq('user_id', user.id)
      ]);

      if (userFoodsResult.error || foodEntriesResult.error) {
        const error = userFoodsResult.error || foodEntriesResult.error;
        console.error('🍽️ FoodLibrary - Database deletion failed:', error);
        setShowDeleteAllConfirm(true);
        throw error;
      }

      console.log('🍽️ FoodLibrary - Database deletion successful');
      
      // Refresh recent foods to show the updated library
      await refreshRecentFoods();
      
      toast({
        title: "All foods removed",
        description: "All foods and food entries have been removed from your library"
      });
    } catch (error) {
      console.error('🍽️ FoodLibrary - Error deleting all foods:', error);
      toast({
        title: "Error",
        description: "Failed to remove all foods",
        variant: "destructive" 
      });
    }
  };

  const updateDefaultFood = async (foodId: string, updates: Partial<DefaultFood>) => {
    try {
      const { error } = await supabase
        .from('default_foods')
        .update(updates)
        .eq('id', foodId);

      if (error) {
        console.error('🔄 FoodLibraryView: Database update error:', error);
        throw error;
      }

      setDefaultFoods(defaultFoods.map(food => 
        food.id === foodId 
          ? { ...food, ...updates }
          : food
      ));
    } catch (error) {
      console.error('🔄 FoodLibraryView: Error updating default food:', error);
      throw error;
    }
  };

  const saveToLibrary = async (food: { name: string; calories: number; carbs: number; serving_size: number }, silent: boolean = false) => {
    if (loading) {
      throw new Error('Database not ready');
    }
    
    const { data, error } = await supabase
      .from('user_foods')
      .insert([{
        user_id: user!.id,
        name: food.name,
        calories_per_100g: Math.round((food.calories / food.serving_size) * 100),
        carbs_per_100g: Math.round((food.carbs / food.serving_size) * 100)
      }])
      .select()
      .single();

    if (error) throw error;

    // Refresh recent foods to show the new addition
    await refreshRecentFoods();
    
    if (!silent) {
      toast({
        title: "Saved to Library",
        description: `${food.name} has been added to your food library`
      });
    }

    return data; // Return the saved food data
  };

  const deleteRecentFood = async (foodName: string) => {
    try {
      // For recent foods, remove all food entries with this name from the user's history
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('user_id', user?.id)
        .eq('name', foodName);

      if (error) throw error;

      // Refresh recent foods to show the updated library
      await refreshRecentFoods();
      
      toast({
        title: "Food removed",
        description: `All entries of "${foodName}" have been removed from your history`
      });
    } catch (error) {
      console.error('Error deleting recent food:', error);
      toast({
        title: "Error",
        description: "Failed to remove food from history",
        variant: "destructive"
      });
    }
  };

  const deleteDefaultFood = async (foodId: string) => {
    try {
      const { error } = await supabase
        .from('default_foods')
        .delete()
        .eq('id', foodId);

      if (error) throw error;

      setDefaultFoods(defaultFoods.filter(food => food.id !== foodId));
      setShowDeleteDefaultFoodConfirm(false);
      setDefaultFoodToDelete(null);
      
      toast({
        title: "Default food removed",
        description: "Default food has been removed from the system"
      });
    } catch (error) {
      console.error('Error deleting default food:', error);
      toast({
        title: "Error",
        description: "Failed to remove default food",
        variant: "destructive"
      });
    }
  };


  // Filter and sort recent foods by recency
  const filteredUserFoods = useMemo(() => {
    if (!foods) return [];
    
    const filtered = foods.filter(food =>
      food.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Sort favorites first, then by recency (most recent first)
    return filtered.sort((a, b) => {
      // Favorites first
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      
      // If both are favorites or both are not favorites, sort by recency
      const aRecentFood = recentFoods.find(rf => rf.id === a.id);
      const bRecentFood = recentFoods.find(rf => rf.id === b.id);
      
      if (!aRecentFood || !bRecentFood) return 0;
      
      return new Date(bRecentFood.last_used).getTime() - new Date(aRecentFood.last_used).getTime();
    });
  }, [foods, searchTerm, recentFoods]);

  const filteredDefaultFoods = useMemo(() => {
    const filtered = defaultFoods.filter(food =>
      food.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).map(food => ({
      ...food,
      is_favorite: defaultFoodFavorites.has(food.id)
    })).sort((a, b) => {
      // Favorites first, then alphabetical
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return a.name.localeCompare(b.name);
    });
    
    console.log('🍽️ Filtered default foods:', filtered.length, 'search:', searchTerm, 'raw default foods:', defaultFoods.length);
    return filtered;
  }, [defaultFoods, defaultFoodFavorites, searchTerm]);

  // Quick access favorites for My Foods
  const favoriteUserFoods = filteredUserFoods.filter(food => food.is_favorite).slice(0, 5);

  const FoodCard = ({ food, isUserFood = true }: { food: UserFood | DefaultFood, isUserFood?: boolean }) => {
    const [showEditModal, setShowEditModal] = useState(false);
    
    const handleCardClick = (e: React.MouseEvent) => {
      // Don't trigger card actions if clicking on interactive elements
      const target = e.target as HTMLElement;
      if (target.closest('button') || 
          target.closest('[role="menuitem"]') || 
          target.closest('[data-radix-dropdown-menu-content]') ||
          target.closest('[data-radix-popper-content-wrapper]') ||
          target.closest('.dropdown-menu') ||
          target.closest('.flex-shrink-0') || // Prevent clicks on button containers
          showEditModal) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Always add to today's plan for both user foods and suggested foods
      handleQuickSelect(food as UserFood, false);
    };

    return (
      <div 
        className="rounded-lg p-2 transition-all duration-200 border border-border/50 bg-card cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-2">
          {/* Options Dropdown */}
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-secondary/80 rounded flex-shrink-0"
                  title="More options"
                  aria-label="More options"
                  onClick={(e) => e.stopPropagation()}
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
                 className="w-52 z-[9999] bg-background border border-border shadow-xl backdrop-blur-sm"
                 style={{ backgroundColor: 'hsl(var(--background))', zIndex: 9999 }}
                 onCloseAutoFocus={(e) => e.preventDefault()}
               >
                      {isUserFood ? (
                        <>
                            {/* Edit option for all user library foods */}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowEditModal(true);
                              }}
                               className="cursor-pointer py-2.5 px-3 flex items-center hover:bg-muted/80 transition-colors"
                             >
                               <Edit className="w-4 h-4 mr-3" />
                               Edit Food
                            </DropdownMenuItem>
                           <DropdownMenuItem
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleQuickSelect(food as UserFood, false);
                              }}
                               className="cursor-pointer py-2.5 px-3 flex items-center hover:bg-muted/80 transition-colors"
                             >
                               <Plus className="w-4 h-4 mr-3" />
                               Add to Today
                            </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToTemplate(food as UserFood);
                            }}
                             className="cursor-pointer py-2.5 px-3 flex items-center hover:bg-muted/80 transition-colors"
                           >
                             <Save className="w-4 h-4 mr-3" />
                             Add to Template
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFood(food.id);
                            }}
                             className="text-destructive focus:text-destructive cursor-pointer py-2.5 px-3 flex items-center hover:bg-destructive/10 transition-colors"
                           >
                             <Trash2 className="w-4 h-4 mr-3" />
                             Delete
                          </DropdownMenuItem>
                       </>
                     ) : (
                        <>
                           {/* Edit option for admin on default foods */}
                           {isAdmin && (
                             <DropdownMenuItem
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setShowEditModal(true);
                               }}
                                className="cursor-pointer py-2.5 px-3 flex items-center hover:bg-muted/80 transition-colors"
                              >
                                <Edit className="w-4 h-4 mr-3" />
                                Edit Food
                             </DropdownMenuItem>
                           )}
                           <DropdownMenuItem
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleQuickSelect(food as UserFood, false);
                              }}
                               className="cursor-pointer py-2.5 px-3 flex items-center hover:bg-muted/80 transition-colors"
                             >
                               <Plus className="w-4 h-4 mr-3" />
                               Add to Today
                            </DropdownMenuItem>
                           <DropdownMenuItem
                             onClick={(e) => {
                               e.stopPropagation();
                               handleAddToTemplate(food as UserFood);
                             }}
                              className="cursor-pointer py-2.5 px-3 flex items-center hover:bg-muted/80 transition-colors"
                            >
                              <Save className="w-4 h-4 mr-3" />
                              Add to Template
                           </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async (e) => {
                                e.stopPropagation();
                                await deleteDefaultFood(food.id);
                              }}
                               className="text-destructive focus:text-destructive cursor-pointer py-2.5 px-3 flex items-center hover:bg-destructive/10 transition-colors"
                             >
                               <Trash2 className="w-4 h-4 mr-3" />
                               Delete Food
                            </DropdownMenuItem>
                       </>
                    )}
                </DropdownMenuContent>
              </DropdownMenu>
          </div>

          {/* Food Image - Compact but visible with placeholder for deleted images */}
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {food.image_url ? (
              <SmartImage
                imageUrl={food.image_url}
                alt={food.name}
                className="w-10 h-10 object-cover rounded-lg"
                fallback={<Utensils className="w-5 h-5 text-muted-foreground" />}
              />
            ) : (
              <Utensils className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          
          {/* Food Info - Compact typography */}
          <div className="flex-1 min-w-0">
            <div className="mb-0.5">
              <h3 className="text-sm font-semibold text-foreground truncate">{food.name}</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{Math.round(food.calories_per_100g)} cal</span>
              <span className="text-muted-foreground/60">•</span>
              <span className="font-medium">{Math.round(food.carbs_per_100g)}g carbs</span>
            </div>
          </div>
           
            {/* Heart Icon for MyFoods tab */}
            {activeTab === 'my-foods' && 'is_favorite' in food && (
              <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                   onClick={async (e) => {
                     e.stopPropagation();
                     if (!isInteractionSafe) {
                       toast({
                         title: "Please wait",
                         description: "System is loading, please try again in a moment"
                       });
                       return;
                     }
                     
                      // All foods in "My Foods" are now proper library foods, so toggle directly
                      await toggleFavorite(food.id, food.is_favorite || false);
                   }}
                   disabled={!isInteractionSafe}
                   className="h-8 w-8 p-0 hover:bg-secondary/80 rounded flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={food.is_favorite ? "Remove from favorites" : "Add to favorites"}
                  aria-label={food.is_favorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart 
                    className={`w-4 h-4 transition-colors ${
                      food.is_favorite 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-muted-foreground hover:text-red-400'
                    }`} 
                  />
                </Button>
              </div>
            )}

            {/* Heart Icon for Suggested tab */}
            {activeTab === 'suggested' && 'is_favorite' in food && (
              <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                   onClick={(e) => {
                     e.stopPropagation();
                     if (!isInteractionSafe) {
                       toast({
                         title: "Please wait",
                         description: "System is loading, please try again in a moment"
                       });
                       return;
                     }
                     toggleDefaultFoodFavorite(food.id, food.is_favorite || false);
                   }}
                   disabled={!isInteractionSafe}
                  className="h-8 w-8 p-0 hover:bg-secondary/80 rounded flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={food.is_favorite ? "Remove from favorites" : "Add to favorites"}
                  aria-label={food.is_favorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart 
                    className={`w-4 h-4 transition-colors ${
                      food.is_favorite 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-muted-foreground hover:text-red-400'
                    }`} 
                  />
                </Button>
              </div>
            )}

            {/* Primary Action Button */}
          <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="default"
              size="sm"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                await handleQuickSelect(food as UserFood, false);
              }}
              className="h-5 w-5 p-1 bg-primary hover:bg-primary/90 rounded"
              title="Add to today's plan"
              aria-label="Add to today's plan"
            >
              <Plus className="w-3 h-3 text-primary-foreground" />
            </Button>
          </div>
        </div>
        
        {/* Edit Modal - Use EditDefaultFoodModal for both cases */}
        {showEditModal && (
          <EditDefaultFoodModal 
            food={food as DefaultFood | UserFood} 
            onUpdate={isUserFood ? updateFood : updateDefaultFood}
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            mode={isUserFood ? 'user' : 'default'}
          />
        )}
      </div>
    );
  };

  return (
    <DatabaseErrorBoundary onRetry={() => window.location.reload()}>
      <div className="h-full flex flex-col">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
          <Input
            placeholder="Search foods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border border-muted-foreground/20"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'my-foods' | 'template' | 'suggested')} className="h-full flex flex-col">
          <div className="mb-4">
            <TabsList className="grid w-full grid-cols-3 text-xs">
              <TabsTrigger value="my-foods" className="flex items-center gap-1 text-xs">
                My Foods
                {filteredUserFoods.length > 0 && (
                  <Trash2 
                    className="w-3 h-3 text-destructive cursor-pointer hover:text-destructive/80" 
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('🗑️ Delete All button clicked, foods count:', filteredUserFoods.length);
                      setShowDeleteAllConfirm(true);
                    }}
                  />
                )}
              </TabsTrigger>
              <TabsTrigger value="template" className="flex items-center gap-1 text-xs">
                Template
                {templateFoods.length > 0 && (
                  <Trash2 
                    className="w-3 h-3 text-destructive cursor-pointer hover:text-destructive/80" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowClearTemplateDialog(true);
                    }}
                  />
                )}
              </TabsTrigger>
              <TabsTrigger value="suggested" className="flex items-center gap-1 text-xs">
                Default
              </TabsTrigger>
            </TabsList>
          </div>

          {/* My Foods Tab */}
          <TabsContent value="my-foods" className="flex-1 overflow-y-auto mt-0">
          <div className="space-y-2 mt-1">
            {/* My Foods List */}
            {isLoading ? (
              <div className="space-y-1">
                {[...Array(8)].map((_, i) => (
                 <div key={i} className="p-2 rounded-lg bg-muted/20 border-0 animate-pulse mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-muted" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 bg-muted rounded w-3/4" />
                        <div className="h-2 bg-muted rounded w-1/2" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-muted rounded" />
                        <div className="w-5 h-5 bg-muted rounded" />
                        <div className="w-5 h-5 bg-muted rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUserFoods.length === 0 ? (
              <div className="text-center py-12">
                <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No foods found' : 'Your library is empty'}
                </p>
                <p className="text-muted-foreground text-sm">
                  {searchTerm ? 'Try a different search term' : 'Log foods to automatically add them to your library'}
                </p>
              </div>
            ) : (
              <div className="space-y-1 overflow-x-hidden">
                {filteredUserFoods.map((food) => (
                  <FoodCard key={food.id} food={food} isUserFood={true} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

          {/* Template Tab */}
          <TabsContent value="template" className="flex-1 overflow-y-auto mt-0">
            <div className="space-y-2 mt-1">
              {/* Apply Template Button */}
              {templateFoods.length > 0 && (
                <div className="mb-4">
                  <Button
                    onClick={() => setShowApplyTemplateDialog(true)}
                    className="w-full flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    size="sm"
                  >
                    <Play className="w-4 h-4" />
                    Apply Template to Today
                  </Button>
                </div>
              )}

              {/* Template Foods List */}
              {templateLoading ? (
                <div className="space-y-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-2 rounded-lg bg-muted/20 border-0 animate-pulse mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-muted" />
                        <div className="flex-1 space-y-1">
                          <div className="h-3 bg-muted rounded w-3/4" />
                          <div className="h-2 bg-muted rounded w-1/2" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-muted rounded" />
                          <div className="w-5 h-5 bg-muted rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : templateFoods.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Your template is empty</p>
                  <p className="text-muted-foreground text-sm">
                    Go to Food Tracking and save today's plan as a template
                  </p>
                </div>
              ) : (
                <div className="space-y-1 overflow-x-hidden">
                  {templateFoods.map((food) => (
                     <div key={food.id} className="rounded-lg p-2 transition-all duration-200 border border-border/50 bg-card">
                       <div className="flex items-center gap-2">
                         {/* Options Dropdown */}
                         <div className="flex-shrink-0">
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 className="h-8 w-8 p-0 hover:bg-secondary/80 rounded flex-shrink-0"
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
                               className="w-52 z-[9999] bg-background border border-border shadow-xl backdrop-blur-sm"
                               style={{ backgroundColor: 'hsl(var(--background))', zIndex: 9999 }}
                               onCloseAutoFocus={(e) => e.preventDefault()}
                             >
                               <DropdownMenuItem
                                 onClick={() => onDeleteTemplateFood?.(food.id)}
                                 className="text-destructive focus:text-destructive cursor-pointer py-2.5 px-3 flex items-center hover:bg-destructive/10 transition-colors"
                               >
                                 <Trash2 className="w-4 h-4 mr-3" />
                                 Delete from Template
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                         </div>

                          {/* Template Food Image */}
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            {food.image_url ? (
                              <SmartImage 
                                imageUrl={food.image_url} 
                                alt={food.name}
                                className="w-10 h-10 object-cover rounded-lg"
                                fallback={<Utensils className="w-5 h-5 text-muted-foreground" />}
                              />
                            ) : (
                              <Utensils className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>

                         {/* Template Food Info */}
                         <div className="flex-1 min-w-0">
                           <div className="mb-0">
                             <h3 className="text-sm font-semibold text-foreground truncate">{food.name}</h3>
                           </div>
                           <div className="flex items-center gap-2 text-xs text-muted-foreground">
                             <span className="font-medium">{Math.round(food.serving_size)}g</span>
                             <span className="text-muted-foreground/60">•</span>
                             <span className="font-medium">{Math.round(food.calories)}</span>
                             <span className="text-muted-foreground/60">•</span>
                             <span className="font-medium">{Math.round(food.carbs)}g</span>
                           </div>
                         </div>

                         {/* Add to Today Button */}
                         <div className="flex-shrink-0">
                           <Button
                             variant="default"
                             size="sm"
                             onClick={() => handleQuickSelect({
                               id: food.id,
                               name: food.name,
                               calories_per_100g: (food.calories / food.serving_size) * 100,
                               carbs_per_100g: (food.carbs / food.serving_size) * 100,
                               is_favorite: false,
                               image_url: food.image_url,
                               variations: []
                             }, false)}
                             className="h-5 w-5 p-1 bg-primary hover:bg-primary/90 rounded"
                             title="Add to today's plan"
                           >
                             <Plus className="w-3 h-3 text-primary-foreground" />
                           </Button>
                         </div>
                       </div>
                     </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Suggested Foods Tab */}
          <TabsContent value="suggested" className="flex-1 overflow-y-auto mt-0">
          <div className="space-y-2 mt-1">
            {isLoading ? (
              <div className="space-y-1">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="p-2 rounded-lg bg-muted/20 border-0 animate-pulse mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-muted" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 bg-muted rounded w-3/4" />
                        <div className="h-2 bg-muted rounded w-1/2" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-muted rounded" />
                        <div className="w-5 h-5 bg-muted rounded" />
                        <div className="w-5 h-5 bg-muted rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredDefaultFoods.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🌟</div>
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm ? 'No suggested foods found' : 'No suggested foods available'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try a different search term' : 'Check back later for curated food suggestions'}
                </p>
              </div>
            ) : (
              <div className="space-y-1 overflow-x-hidden">
                {filteredDefaultFoods.map((food) => (
                  <FoodCard key={`default-${food.id}`} food={food} isUserFood={false} />
                ))}
              </div>
            )}
          </div>
         </TabsContent>

        </Tabs>
      </div>


      {/* Delete All Confirmation Dialog */}
      <ConfirmationModal
        isOpen={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={() => {
          console.log('🗑️ Delete All confirmed, calling deleteAllUserFoods');
          deleteAllUserFoods();
        }}
        title="Delete All Foods?"
        message={`This will permanently delete all ${filteredUserFoods.length} foods from your personal library. This action cannot be undone.`}
        confirmText="Delete All"
        variant="destructive"
      />

      {/* Delete Default Food Confirmation Dialog */}
      <ConfirmationModal
        isOpen={showDeleteDefaultFoodConfirm}
        onClose={() => {
          setShowDeleteDefaultFoodConfirm(false);
          setDefaultFoodToDelete(null);
        }}
        onConfirm={() => defaultFoodToDelete && deleteDefaultFood(defaultFoodToDelete.id)}
        title="Delete Default Food?"
        message={`This will permanently delete "${defaultFoodToDelete?.name}" from the default food system. This action cannot be undone and will affect all users.`}
        confirmText="Delete Food"
        variant="destructive"
      />

      {/* Clear Template Confirmation Dialog */}
      <ConfirmationModal
        isOpen={showClearTemplateDialog}
        onClose={() => setShowClearTemplateDialog(false)}
        onConfirm={() => onClearTemplate?.()}
        title="Clear Template?"
        message={`This will permanently delete all ${templateFoods.length} foods from your daily template. This action cannot be undone.`}
        confirmText="Clear Template"
        variant="destructive"
      />

      {/* Apply Template Confirmation Dialog */}
      <ConfirmationModal
        isOpen={showApplyTemplateDialog}
        onClose={() => setShowApplyTemplateDialog(false)}
        onConfirm={() => onApplyTemplate?.()}
        title="Apply Template?"
        message={`This will add all ${templateFoods.length} foods from your template to today's plan.`}
        confirmText="Apply Template"
        variant="default"
      />
      </div>
    </DatabaseErrorBoundary>
  );
};