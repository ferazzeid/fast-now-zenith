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

interface FoodLibraryViewProps {
  onSelectFood: (food: UserFood, consumed?: boolean) => void;
  onBack: () => void;
}

export const FoodLibraryView = ({ onSelectFood, onBack }: FoodLibraryViewProps) => {
  const [foods, setFoods] = useState<UserFood[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadUserFoods();
  }, [user]);

  const loadUserFoods = async () => {
    if (!user) return;
    
    setLoading(true);
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
    } finally {
      setLoading(false);
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

  const filteredFoods = foods.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold">My Food Library</h2>
        <span className="text-sm text-muted-foreground">{filteredFoods.length} items</span>
      </div>

      {/* Search */}
      <div className="relative px-4">
        <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
            <Card key={i} className="mx-4 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted animate-pulse rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </div>
                <div className="flex gap-1">
                  <div className="w-6 h-6 bg-muted animate-pulse rounded" />
                  <div className="w-6 h-6 bg-muted animate-pulse rounded" />
                  <div className="w-6 h-6 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredFoods.length === 0 ? (
        <div className="text-center py-12 px-4">
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
          {filteredFoods.map((food) => (
            <Card key={food.id} className="mx-4 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                {food.image_url ? (
                  <img 
                    src={food.image_url} 
                    alt={food.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-muted-foreground text-lg">🍽️</span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-base truncate">{food.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{food.calories_per_100g} cal</span>
                    <span>{food.carbs_per_100g}g carbs</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(food.id, food.is_favorite)}
                    className="p-1 h-8 w-8"
                  >
                    {food.is_favorite ? (
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    ) : (
                      <Heart className="w-4 h-4 text-muted-foreground" />
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
                    className="p-1 h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                        <Plus className="w-4 h-4" />
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};