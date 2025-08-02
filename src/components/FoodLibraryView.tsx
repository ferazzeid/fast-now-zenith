import React, { useState, useEffect } from 'react';
import { Heart, Search, Trash2, Edit, Plus, ShoppingCart, Check, ArrowLeft, Star, MoreVertical, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { EditLibraryFoodModal } from '@/components/EditLibraryFoodModal';
import { EditDefaultFoodModal } from '@/components/EditDefaultFoodModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const [activeTab, setActiveTab] = useState<'my-foods' | 'suggested'>('my-foods');
  
  // Multi-selection state
  const [selectedFoods, setSelectedFoods] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

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
    
    onSelectFood(userFood, consumed);
    
    toast({
      title: "Added to plan",
      description: `${food.name} has been added to your food plan`,
    });
    
    // Auto-close library after selection
    setTimeout(() => {
      onBack();
    }, 1000);
  };

  const importToMyLibrary = async (defaultFood: DefaultFood) => {
    if (!user) return;
    
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
    try {
      const { error } = await supabase
        .from('user_foods')
        .update({ is_favorite: !currentFavorite })
        .eq('id', foodId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setFoods(foods.map(food => 
        food.id === foodId 
          ? { ...food, is_favorite: !currentFavorite }
          : food
      ));
    } catch (error) {
      console.error('Error updating favorite:', error);
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
    try {
      const { error } = await supabase
        .from('user_foods')
        .update(updates)
        .eq('id', foodId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setFoods(foods.map(food => 
        food.id === foodId 
          ? { ...food, ...updates }
          : food
      ));
    } catch (error) {
      console.error('Error updating food:', error);
      throw error;
    }
  };

  const deleteFood = async (foodId: string) => {
    try {
      const { error } = await supabase
        .from('user_foods')
        .delete()
        .eq('id', foodId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setFoods(foods.filter(food => food.id !== foodId));
      toast({
        title: "Food removed",
        description: "Food has been removed from your library"
      });
    } catch (error) {
      console.error('Error deleting food:', error);
      toast({
        title: "Error",
        description: "Failed to remove food",
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

  // Multi-selection functions
  const toggleFoodSelection = (foodId: string) => {
    setSelectedFoods(prev => {
      const newSet = new Set(prev);
      if (newSet.has(foodId)) {
        newSet.delete(foodId);
      } else {
        newSet.add(foodId);
      }
      
      // Update multi-select mode based on selection count
      setIsMultiSelectMode(newSet.size > 0);
      
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedFoods(new Set());
    setIsMultiSelectMode(false);
  };

  const handleBulkAddToMeal = async () => {
    if (selectedFoods.size === 0) return;
    
    const selectedFoodItems = foods.filter(food => selectedFoods.has(food.id));
    
    // Add each selected food to the meal plan
    for (const food of selectedFoodItems) {
      onSelectFood(food, false);
    }
    
    toast({
      title: "Added to plan",
      description: `${selectedFoods.size} foods have been added to your food plan`,
    });

    // Clear selection and close library
    clearSelection();
    setTimeout(() => {
      onBack();
    }, 1000);
  };

  const getSelectedFoodsTotals = () => {
    const selectedFoodItems = foods.filter(food => selectedFoods.has(food.id));
    const totalCalories = selectedFoodItems.reduce((sum, food) => sum + food.calories_per_100g, 0);
    const totalCarbs = selectedFoodItems.reduce((sum, food) => sum + food.carbs_per_100g, 0);
    return { totalCalories, totalCarbs };
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
    const isSelected = isUserFood && selectedFoods.has(food.id);
    const canMultiSelect = isUserFood && activeTab === 'my-foods';
    
    const handleCardClick = () => {
      if (canMultiSelect && isMultiSelectMode) {
        toggleFoodSelection(food.id);
      } else if (isUserFood) {
        handleQuickSelect(food as UserFood, false);
      } else {
        importToMyLibrary(food as DefaultFood);
      }
    };

    return (
      <div 
        className={`p-1 rounded border transition-all duration-200 max-w-full overflow-hidden cursor-pointer ${
          isSelected 
            ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary/20' 
            : isUserFood 
              ? 'bg-ceramic-plate border-ceramic-rim hover:bg-ceramic-plate/80' 
              : 'bg-ceramic-plate/50 border-ceramic-rim hover:bg-ceramic-plate/70'
        }`}
        onClick={handleCardClick}
      >
        <div className="flex items-center w-full max-w-full overflow-hidden">
          {/* Multi-select checkbox (only for user foods in my-foods tab) */}
          {canMultiSelect && (isMultiSelectMode || isSelected) && (
            <div className="flex-shrink-0 mr-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleFoodSelection(food.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4"
              />
            </div>
          )}

          {/* Food Image */}
          {food.image_url ? (
            <img 
              src={food.image_url} 
              alt={food.name}
              className="w-7 h-7 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded bg-ceramic-base flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🍽️</span>
            </div>
          )}
          
          {/* Food Info */}
          <div className="flex-1 min-w-0 pl-2 overflow-hidden">
            <div className="w-full overflow-hidden">
              <span className="text-sm font-medium text-warm-text truncate block">{food.name}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-warm-text/80 overflow-hidden">
              <span className="whitespace-nowrap">{food.calories_per_100g}</span>
              <span className="text-warm-text/60">•</span>
              <span className="whitespace-nowrap truncate">{food.carbs_per_100g}g</span>
            </div>
          </div>
          
          {/* Actions - only show when not in multi-select mode or food is not selectable */}
          {(!isMultiSelectMode || !canMultiSelect) && (
            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {/* Favorite button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  isUserFood ? 
                    toggleFavorite(food.id, (food as UserFood).is_favorite) :
                    toggleDefaultFoodFavorite(food.id, (food as DefaultFood).is_favorite || false)
                }}
                className="p-1 h-6 w-6 hover:bg-primary/10"
                title={food.is_favorite ? "Remove from favorites" : "Add to favorites"}
              >
                {food.is_favorite ? (
                  <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                ) : (
                  <Heart className="w-3 h-3 text-muted-foreground" />
                )}
              </Button>

              {/* Options Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-6 w-6 hover:bg-muted"
                    title="More options"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-20 z-50">
                  {isUserFood ? (
                    <>
                      <EditLibraryFoodModal 
                        food={food as UserFood} 
                        onUpdate={updateFood}
                      />
                      <DropdownMenuItem
                        onClick={() => deleteFood(food.id)}
                        className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      {isAdmin && (
                        <>
                          <EditDefaultFoodModal 
                            food={food as DefaultFood} 
                            onUpdate={updateDefaultFood}
                          />
                          <DropdownMenuItem
                            onClick={() => deleteDefaultFood(food.id)}
                            className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Primary Action Button */}
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  isUserFood ? 
                    handleQuickSelect(food as UserFood, false) : 
                    importToMyLibrary(food as DefaultFood)
                }}
                className="h-6 px-2 text-xs font-medium flex-shrink-0"
                title={isUserFood ? "Add to today's plan" : "Import to your library"}
              >
                {isUserFood ? (
                  <Plus className="w-3 h-3" />
                ) : (
                  <Download className="w-3 h-3" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col max-w-full overflow-hidden">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Food Library</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200"
            title="Close Food Library"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search foods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>


      {/* Two-Library System Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'my-foods' | 'suggested')} className="h-full flex flex-col max-w-full overflow-hidden">
        <div className="px-1 pt-1">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="my-foods" className="flex items-center gap-1 text-xs">
              <Heart className="w-3 h-3" />
              My Food ({filteredUserFoods.length})
            </TabsTrigger>
            <TabsTrigger value="suggested" className="flex items-center gap-1 text-xs">
              <Star className="w-3 h-3" />
              Suggested ({filteredDefaultFoods.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* My Foods Tab */}
        <TabsContent value="my-foods" className="flex-1 overflow-y-auto overflow-x-hidden px-1 pb-4">
          <div className="space-y-2 mt-1">
            {/* My Foods List */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                 <div key={i} className="p-2 rounded-lg bg-ceramic-plate border border-ceramic-rim animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-ceramic-base" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-warm-text/20 rounded w-3/4" />
                        <div className="h-3 bg-warm-text/20 rounded w-1/2" />
                      </div>
                      <div className="flex gap-1">
                        <div className="w-7 h-7 bg-warm-text/20 rounded" />
                        <div className="w-7 h-7 bg-warm-text/20 rounded" />
                        <div className="w-12 h-7 bg-warm-text/20 rounded" />
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
              <div className="space-y-2 overflow-x-hidden">
                {filteredUserFoods.map((food) => (
                  <FoodCard key={food.id} food={food} isUserFood={true} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Suggested Foods Tab */}
        <TabsContent value="suggested" className="flex-1 overflow-y-auto overflow-x-hidden px-1 pb-4">
          <div className="space-y-2 mt-1">
            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-2 rounded-lg bg-ceramic-plate/50 border border-ceramic-rim animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-ceramic-base" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-warm-text/20 rounded w-3/4" />
                        <div className="h-3 bg-warm-text/20 rounded w-1/2" />
                      </div>
                      <div className="flex gap-1">
                        <div className="w-7 h-7 bg-warm-text/20 rounded" />
                        <div className="w-12 h-7 bg-warm-text/20 rounded" />
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
              <div className="space-y-2 overflow-x-hidden">
                {filteredDefaultFoods.map((food) => (
                  <FoodCard key={`default-${food.id}`} food={food} isUserFood={false} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        </Tabs>
      </div>

      {/* Sticky Action Bar - appears when foods are selected */}
      {isMultiSelectMode && selectedFoods.size > 0 && (
        <div className="sticky bottom-0 left-0 right-0 z-20 bg-background border-t border-border px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>{selectedFoods.size} food{selectedFoods.size === 1 ? '' : 's'} selected</span>
                <div className="text-xs text-muted-foreground">
                  {(() => {
                    const { totalCalories, totalCarbs } = getSelectedFoodsTotals();
                    return `${totalCalories} cal • ${totalCarbs}g carbs`;
                  })()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="h-9"
              >
                Clear
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleBulkAddToMeal}
                className="h-9 px-4"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add {selectedFoods.size} to plan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};