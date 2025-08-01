import React, { useState, useEffect } from 'react';
import { Heart, Search, Trash2, Edit, Plus, ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditLibraryFoodModal } from '@/components/EditLibraryFoodModal';
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
}

interface FoodLibraryViewProps {
  onSelectFood: (food: UserFood, consumed?: boolean) => void;
  onBack: () => void;
}

export const FoodLibraryView = ({ onSelectFood, onBack }: FoodLibraryViewProps) => {
  const [foods, setFoods] = useState<UserFood[]>([]);
  const [defaultFoods, setDefaultFoods] = useState<DefaultFood[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadUserFoods(),
          loadDefaultFoods()
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadData();
    }
  }, [user]);

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
        description: "Failed to load common foods",
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

  const filteredUserFoods = foods.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDefaultFoods = defaultFoods.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                    <span className="text-xs bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">Common</span>
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