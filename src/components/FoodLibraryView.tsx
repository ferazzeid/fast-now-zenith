import React, { useState, useEffect } from 'react';
import { Heart, Search, Trash2, Edit, Plus, ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  is_favorite?: boolean; // Track if user has favorited this default food
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
        description: "Failed to load default foods",
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
        // Remove from favorites
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
        // Add to favorites
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
      console.log('Updating default food:', foodId, 'with updates:', updates);
      const { error } = await supabase
        .from('default_foods')
        .update(updates)
        .eq('id', foodId);

      if (error) {
        console.error('Error updating default food:', error);
        throw error;
      }

      console.log('Default food updated successfully');
      // Update local state
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

  const filteredUserFoods = foods.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDefaultFoods = defaultFoods.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).map(food => ({
    ...food,
    is_favorite: defaultFoodFavorites.has(food.id)
  }));

  const allFilteredFoods = [...filteredUserFoods, ...filteredDefaultFoods];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-lg font-semibold">My Food Library</h2>
        <span className="text-sm text-muted-foreground">{allFilteredFoods.length} items</span>
      </div>

      {/* Search */}
      <div className="relative px-2">
        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search your foods..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Food Grid */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-2 rounded-lg bg-ceramic-plate border border-ceramic-rim">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-ceramic-base flex items-center justify-center flex-shrink-0">
                  <div className="w-4 h-4 bg-warm-text/20 rounded animate-pulse" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-warm-text/20 animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-warm-text/20 animate-pulse rounded w-1/2" />
                </div>
                <div className="flex gap-1">
                  <div className="w-6 h-6 bg-warm-text/20 animate-pulse rounded" />
                  <div className="w-6 h-6 bg-warm-text/20 animate-pulse rounded" />
                  <div className="w-6 h-6 bg-warm-text/20 animate-pulse rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : allFilteredFoods.length === 0 ? (
        <div className="text-center py-12 px-2">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-lg font-medium mb-2">
            {searchTerm ? 'No foods found' : 'Your library is empty'}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try a different search term' : 'Log foods to automatically add them to your library'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* User Foods */}
          {filteredUserFoods.map((food) => (
            <div key={food.id} className="p-2 rounded-lg bg-ceramic-plate border border-ceramic-rim transition-colors hover:shadow-md">
              <div className="flex items-center gap-2">
                {/* Food Image */}
                {food.image_url ? (
                  <img 
                    src={food.image_url} 
                    alt={food.name}
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-ceramic-base flex items-center justify-center flex-shrink-0">
                    <div className="w-4 h-4 bg-warm-text/20 rounded flex items-center justify-center">
                      <span className="text-xs text-warm-text/60">🍽️</span>
                    </div>
                  </div>
                )}
                
                {/* Food Info */}
                <div className="flex-1 min-w-0">
                  {/* First Line: Food name only */}
                  <div className="flex items-center">
                    <span className="font-medium text-warm-text truncate flex-1">{food.name}</span>
                  </div>
                  {/* Second Line: Nutritional data */}
                  <div className="flex items-center gap-1 text-xs text-warm-text/80 mt-1">
                    <span>{food.calories_per_100g} cal</span>
                    <span className="text-warm-text/60">•</span>
                    <span>{food.carbs_per_100g}g carbs</span>
                    <span className="text-warm-text/60">•</span>
                    <span>per 100g</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(food.id, food.is_favorite)}
                    className="p-1 h-6 w-6 hover:bg-primary/10"
                    title={food.is_favorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    {food.is_favorite ? (
                      <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                    ) : (
                      <Heart className="w-3 h-3 text-muted-foreground" />
                    )}
                  </Button>
                  
                  <EditLibraryFoodModal 
                    food={food} 
                    onUpdate={updateFood}
                  />
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteFood(food.id)}
                    className="p-1 h-6 w-6 hover:bg-destructive/10"
                    title="Delete food"
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1 h-6 w-6 hover:bg-primary/10" title="Add food">
                        <Plus className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelectFood(food, false)}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Shopping List
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSelectFood(food, true)}>
                        <Check className="w-4 h-4 mr-2" />
                        Mark as Eaten
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
          
          {/* Default Foods */}
          {filteredDefaultFoods.map((food) => (
            <div key={`default-${food.id}`} className="p-2 rounded-lg bg-ceramic-plate/50 border border-ceramic-rim transition-colors hover:shadow-md">
              <div className="flex items-center gap-2">
                {/* Food Image */}
                {food.image_url ? (
                  <img 
                    src={food.image_url} 
                    alt={food.name}
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-ceramic-base flex items-center justify-center flex-shrink-0">
                    <div className="w-4 h-4 bg-warm-text/20 rounded flex items-center justify-center">
                      <span className="text-xs text-warm-text/60">🍽️</span>
                    </div>
                  </div>
                )}
                
                {/* Food Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-warm-text truncate flex-1">{food.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-warm-text/80 mt-1">
                    <span>{food.calories_per_100g} cal</span>
                    <span className="text-warm-text/60">•</span>
                    <span>{food.carbs_per_100g}g carbs</span>
                    <span className="text-warm-text/60">•</span>
                    <span>per 100g</span>
                  </div>
                </div>
                
                {/* Actions for Default Foods */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Favorite button for all users */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDefaultFoodFavorite(food.id, food.is_favorite || false)}
                    className="p-1 h-6 w-6 hover:bg-primary/10"
                    title={food.is_favorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    {food.is_favorite ? (
                      <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                    ) : (
                      <Heart className="w-3 h-3 text-muted-foreground" />
                    )}
                  </Button>
                  
                  {/* Admin-only actions */}
                  {isAdmin && (
                    <>
                      <EditDefaultFoodModal 
                        food={food} 
                        onUpdate={updateDefaultFood}
                      />
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDefaultFood(food.id)}
                        className="p-1 h-6 w-6 hover:bg-destructive/10"
                        title="Delete default food"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1 h-6 w-6 hover:bg-primary/10" title="Add food">
                        <Plus className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelectFood({
                        ...food,
                        is_favorite: false,
                        variations: []
                      } as UserFood, false)}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Shopping List
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSelectFood({
                        ...food,
                        is_favorite: false,
                        variations: []
                      } as UserFood, true)}>
                        <Check className="w-4 h-4 mr-2" />
                        Mark as Eaten
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};