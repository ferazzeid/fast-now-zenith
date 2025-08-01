import React, { useState, useEffect } from 'react';
import { Heart, Search, Trash2, Edit, ArrowLeft } from 'lucide-react';
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack} size="sm" className="h-8 w-8 p-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-bold">My Food Library</h2>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search your foods..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Food Grid */}
      {loading ? (
        <div className="grid gap-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-3">
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
        <div className="grid gap-3">
          {filteredFoods.map((food) => (
            <Card key={food.id} className="p-3 hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                {/* Food Image */}
                <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-accent">
                  {food.image_url ? (
                    <img 
                      src={food.image_url} 
                      alt={food.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">🍽️</span>
                  )}
                </div>
                
                {/* Food Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate text-base">{food.name}</h3>
                    {food.is_favorite && (
                      <Heart className="w-3 h-3 text-red-500 fill-current shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {food.calories_per_100g} cal • {food.carbs_per_100g}g carbs
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(food.id, food.is_favorite)}
                    className="h-6 w-6 p-0"
                  >
                    <Heart className={`w-3 h-3 ${food.is_favorite ? 'text-red-500 fill-current' : 'text-muted-foreground'}`} />
                  </Button>
                  
                  <EditLibraryFoodModal 
                    food={food} 
                    onUpdate={updateFood}
                  />
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteFood(food.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="h-6 px-2 ml-2"
                      >
                        Add
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelectFood(food, false)}>
                        Add to Shopping List
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSelectFood(food, true)}>
                        Add to Eaten List
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