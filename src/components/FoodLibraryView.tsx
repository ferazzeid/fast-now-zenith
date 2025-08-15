import React, { useState, useEffect } from 'react';
import { Heart, Search, Trash2, Edit, Plus, ShoppingCart, Check, ArrowLeft, Star, MoreVertical, Download, X, Utensils, Clock, Save } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EditDefaultFoodModal } from '@/components/EditDefaultFoodModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRecentFoods } from '@/hooks/useRecentFoods';
import { useFoodContext } from '@/hooks/useFoodContext';

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

interface FoodLibraryViewProps {
  onSelectFood: (food: UserFood, consumed?: boolean) => void;
  onBack: () => void;
}

export const FoodLibraryView = ({ onSelectFood, onBack }: FoodLibraryViewProps) => {
  const [foods, setFoods] = useState<UserFood[]>([]);
  const [defaultFoods, setDefaultFoods] = useState<DefaultFood[]>([]);
  const [defaultFoodFavorites, setDefaultFoodFavorites] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'my-foods' | 'suggested'>('recent');
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  
  // Visual feedback state
  const [flashingItems, setFlashingItems] = useState<Set<string>>(new Set());
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { recentFoods, loading: recentLoading, refreshRecentFoods } = useRecentFoods();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadUserFoods(),
          loadDefaultFoods(),
          loadDefaultFoodFavorites(),
          checkAdminRole()
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadData();
    }
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      if (error) throw error;
      setIsAdmin(data || false);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    }
  };

  const loadUserFoods = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_foods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_favorite', { ascending: false })
        .order('name');

      if (error) throw error;
      setFoods(data || []);
    } catch (error) {
      console.error('Error loading user foods:', error);
      toast({
        title: "Error",
        description: "Failed to load your food library",
        variant: "destructive"
      });
    }
  };

  const loadDefaultFoods = async () => {
    try {
      const { data, error } = await supabase
        .from('default_foods')
        .select('*')
        .order('name');

      if (error) throw error;
      setDefaultFoods(data || []);
    } catch (error) {
      console.error('Error loading default foods:', error);
      toast({
        title: "Warning",
        description: "Failed to load suggested foods",
        variant: "destructive"
      });
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

  const handleQuickSelect = (food: UserFood | DefaultFood, consumed: boolean = false) => {
    const userFood = 'variations' in food ? food : {
      ...food,
      is_favorite: false,
      variations: []
    } as UserFood;
    
    // Add visual feedback
    setFlashingItems(prev => new Set([...prev, food.id]));
    setTimeout(() => {
      setFlashingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(food.id);
        return newSet;
      });
    }, 600);
    
    onSelectFood(userFood, consumed);
  };

  const handleAddToTemplate = async (food: UserFood | DefaultFood) => {
    if (!user) return;
    
    console.log('🍽️ FoodLibrary - handleAddToTemplate called with:', food);
    
    // Add visual feedback
    setFlashingItems(prev => new Set([...prev, food.id]));
    setTimeout(() => {
      setFlashingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(food.id);
        return newSet;
      });
    }, 600);
    
    try {
      const { data, error } = await supabase
        .from('daily_food_templates')
        .insert({
          user_id: user.id,
          name: food.name,
          calories: food.calories_per_100g,
          carbs: food.carbs_per_100g,
          serving_size: 100,
          image_url: food.image_url
        })
        .select()
        .single();

      if (error) {
        console.error('🍽️ FoodLibrary - handleAddToTemplate error:', error);
        throw error;
      }

      console.log('🍽️ FoodLibrary - handleAddToTemplate success:', data);
      
      toast({
        title: "Added to templates",
        description: `${food.name} has been added to your daily templates`,
      });
    } catch (error) {
      console.error('🍽️ FoodLibrary - handleAddToTemplate failed:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add food to templates"
      });
    }
  };

  const importToMyLibrary = async (defaultFood: DefaultFood) => {
    if (!user) return;
    
    // Add visual feedback
    setFlashingItems(prev => new Set([...prev, defaultFood.id]));
    setTimeout(() => {
      setFlashingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(defaultFood.id);
        return newSet;
      });
    }, 600);
    
    try {
      const { data, error } = await supabase
        .from('user_foods')
        .insert({
          user_id: user.id,
          name: defaultFood.name,
          calories_per_100g: defaultFood.calories_per_100g,
          carbs_per_100g: defaultFood.carbs_per_100g,
          image_url: defaultFood.image_url,
          is_favorite: false,
          variations: []
        })
        .select()
        .single();

      if (error) throw error;

      setFoods(prev => [...prev, data]);
      
      toast({
        title: "Food imported",
        description: `${defaultFood.name} has been added to your personal library`,
      });
    } catch (error) {
      console.error('Error importing food:', error);
      toast({
        title: "Error",
        description: "Failed to import food to your library",
        variant: "destructive"
      });
    }
  };

  const toggleFavorite = async (foodId: string, currentFavorite: boolean) => {
    console.log('🍽️ FoodLibrary - toggleFavorite called with:', { foodId, currentFavorite });
    try {
      const { data, error } = await supabase
        .from('user_foods')
        .update({ is_favorite: !currentFavorite })
        .eq('id', foodId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) {
        console.error('🍽️ FoodLibrary - toggleFavorite error:', error);
        throw error;
      }

      console.log('🍽️ FoodLibrary - toggleFavorite success:', data);

      // Use functional state update to avoid stale closure
      setFoods(prevFoods => prevFoods.map(food => 
        food.id === foodId 
          ? { ...food, is_favorite: !currentFavorite }
          : food
      ));
    } catch (error) {
      console.error('🍽️ FoodLibrary - toggleFavorite failed:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update favorite status"
      });
    }
  };

  const toggleDefaultFoodFavorite = async (foodId: string, isFavorite: boolean) => {
    if (!user) return;
    
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

      // Use functional state update to avoid stale closure
      setFoods(prevFoods => prevFoods.map(food => 
        food.id === foodId 
          ? { ...food, ...updates }
          : food
      ));

      console.log('🍽️ FoodLibrary - food updated in local state');
    } catch (error) {
      console.error('🍽️ FoodLibrary - updateFood failed:', error);
      throw error;
    }
  };

  const deleteFood = async (foodId: string) => {
    console.log('🍽️ FoodLibrary - deleteFood called with:', { foodId });
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

      // Use functional state update to avoid stale closure
      setFoods(prevFoods => prevFoods.filter(food => food.id !== foodId));
      
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
    
    try {
      const { error } = await supabase
        .from('user_foods')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setFoods([]);
      setShowDeleteAllConfirm(false);
      
      toast({
        title: "All foods removed",
        description: "All foods have been removed from your library"
      });
    } catch (error) {
      console.error('Error deleting all foods:', error);
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

      if (error) throw error;

      setDefaultFoods(defaultFoods.map(food => 
        food.id === foodId 
          ? { ...food, ...updates }
          : food
      ));
    } catch (error) {
      console.error('Error updating default food:', error);
      throw error;
    }
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

      // Refresh recent foods to update the list
      refreshRecentFoods();
      
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


  const filteredUserFoods = foods.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    // Favorites first, then alphabetical
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    return a.name.localeCompare(b.name);
  });

  const filteredDefaultFoods = defaultFoods.filter(food =>
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

  // Quick access favorites for My Foods
  const favoriteUserFoods = filteredUserFoods.filter(food => food.is_favorite).slice(0, 5);

  const FoodCard = ({ food, isUserFood = true }: { food: UserFood | DefaultFood, isUserFood?: boolean }) => {
    const isFlashing = flashingItems.has(food.id);
    const [showEditModal, setShowEditModal] = useState(false);
    
    const handleCardClick = (e: React.MouseEvent) => {
      // Don't trigger card actions if clicking on interactive elements
      const target = e.target as HTMLElement;
      if (target.closest('button') || 
          target.closest('[role="menuitem"]') || 
          target.closest('[data-radix-dropdown-menu-content]') ||
          target.closest('[data-radix-popper-content-wrapper]') ||
          target.closest('.dropdown-menu') ||
          showEditModal) {
        e.stopPropagation();
        return;
      }

      if (isUserFood) {
        handleQuickSelect(food as UserFood, false);
      } else {
        // For Recent and Suggested foods, add them directly to today's plan
        if (activeTab === 'recent' || activeTab === 'suggested') {
          handleQuickSelect(food as UserFood, false);
        } else {
          importToMyLibrary(food as DefaultFood);
        }
      }
    };

    return (
      <div 
        className={`p-3 mx-2 rounded-lg transition-all duration-200 cursor-pointer bg-muted/20 border-0 hover:bg-muted/30 ${
          isFlashing ? 'animate-success-flash' : ''
        }`}
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
                  className="min-w-[44px] min-h-[44px] p-2 hover:bg-secondary/80 rounded-md flex items-center justify-center"
                  title="More options"
                  aria-label="More options"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4 text-primary" />
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
                   {isUserFood ? (
                     <>
                         <DropdownMenuItem
                           onClick={(e) => {
                             e.stopPropagation();
                             handleQuickSelect(food as UserFood, false);
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
                            Add to Templates
                         </DropdownMenuItem>
                         {/* Only show Edit option for user foods and admin for default foods */}
                         {(isUserFood || isAdmin) && !food.id.startsWith('recent-') && (
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
                           onClick={(e) => {
                             e.stopPropagation();
                             deleteFood(food.id);
                           }}
                            className="text-destructive focus:text-destructive cursor-pointer py-2.5 px-3 flex items-center hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 mr-3" />
                            Delete Food
                         </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                         <DropdownMenuItem
                           onClick={(e) => {
                             e.stopPropagation();
                             handleQuickSelect(food as UserFood, false);
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
                             Add to Templates
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              importToMyLibrary(food as DefaultFood);
                            }}
                             className="cursor-pointer py-2.5 px-3 flex items-center hover:bg-muted/80 transition-colors"
                           >
                             <Download className="w-4 h-4 mr-3" />
                             Add to Library
                          </DropdownMenuItem>
                          {food.id.startsWith('recent-') ? (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteRecentFood(food.name);
                              }}
                               className="text-destructive focus:text-destructive cursor-pointer py-2.5 px-3 flex items-center hover:bg-destructive/10 transition-colors"
                             >
                               <Trash2 className="w-4 h-4 mr-3" />
                               Remove from History
                            </DropdownMenuItem>
                          ) : isAdmin && (
                            <>
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
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   deleteDefaultFood(food.id);
                                 }}
                                  className="text-destructive focus:text-destructive cursor-pointer py-2.5 px-3 flex items-center hover:bg-destructive/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 mr-3" />
                                  Delete Food
                               </DropdownMenuItem>
                            </>
                          )}
                      </>
                    )}
                </DropdownMenuContent>
              </DropdownMenu>
          </div>

          {/* Food Image - Compact but visible with placeholder for deleted images */}
          {food.image_url ? (
            <img 
              src={food.image_url} 
              alt={food.name}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              loading="lazy"
              onError={(e) => {
                // Show placeholder if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const placeholder = target.nextElementSibling as HTMLElement;
                if (placeholder) {
                  placeholder.style.display = 'flex';
                }
              }}
            />
           ) : null}
           {/* Default placeholder - always present, hidden when image loads */}
           <div 
             className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 ${
               food.image_url ? 'hidden' : 'flex'
             }`}
           >
             <Utensils className="w-5 h-5 text-muted-foreground" />
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
           
            {/* Primary Action Button */}
          <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (isUserFood) {
                  handleQuickSelect(food as UserFood, false);
                } else if (activeTab === 'recent' || activeTab === 'suggested') {
                  handleQuickSelect(food as UserFood, false);
                } else {
                  importToMyLibrary(food as DefaultFood);
                }
              }}
              className={`min-w-[44px] min-h-[44px] p-2 flex-shrink-0 rounded-md flex items-center justify-center hover:bg-primary/90 transition-colors ${
                isFlashing ? 'animate-button-success' : ''
              }`}
              title={isUserFood || activeTab === 'recent' || activeTab === 'suggested' ? "Add to today's plan" : "Import to your library"}
              aria-label={isUserFood || activeTab === 'recent' || activeTab === 'suggested' ? "Add to today's plan" : "Import to your library"}
            >
              {isUserFood || activeTab === 'recent' || activeTab === 'suggested' ? (
                <Plus className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )}
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
    <div className="h-full flex flex-col max-w-7xl mx-auto">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Food Library</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-2 py-4 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'recent' | 'my-foods' | 'suggested')} className="h-full flex flex-col">
          <div className="mb-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="my-foods" className="flex items-center gap-2">
                My Food
                {filteredUserFoods.length > 0 && (
                  <Trash2 
                    className="w-3 h-3 text-destructive cursor-pointer hover:text-destructive/80" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteAllConfirm(true);
                    }}
                  />
                )}
              </TabsTrigger>
              <TabsTrigger value="suggested">Default</TabsTrigger>
            </TabsList>
          </div>

          {/* My Foods Tab */}
          <TabsContent value="my-foods" className="flex-1 overflow-y-auto mt-0">
          <div className="space-y-2 mt-1">
            {/* My Foods List */}
            {loading ? (
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
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm ? 'No foods found' : 'Your library is empty'}
                </h3>
                <p className="text-muted-foreground">
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

          {/* Suggested Foods Tab */}
          <TabsContent value="suggested" className="flex-1 overflow-y-auto mt-0">
          <div className="space-y-2 mt-1">
            {loading ? (
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

          {/* Recent Foods Tab */}
          <TabsContent value="recent" className="flex-1 overflow-y-auto mt-0">
            <div className="space-y-2 mt-1">
              {recentLoading ? (
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
              ) : recentFoods.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⏰</div>
                  <h3 className="text-lg font-medium mb-2">No recent foods</h3>
                  <p className="text-muted-foreground">
                    Foods you've logged recently will appear here for quick access
                  </p>
                </div>
              ) : (
                <div className="space-y-1 overflow-x-hidden">
                  {recentFoods.map((food) => (
                    <FoodCard key={`recent-${food.id}`} food={food} isUserFood={false} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>


      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Foods?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {filteredUserFoods.length} foods from your personal library. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAllUserFoods}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};