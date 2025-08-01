import React, { useState, useEffect } from 'react';
import { Heart, Plus, Search, Trash2, X, ChevronDown } from 'lucide-react';
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

interface PersonalFoodLibraryProps {
  onSelectFood: (food: UserFood, consumed?: boolean) => void;
  onClose: () => void;
}

export const PersonalFoodLibrary = ({ onSelectFood, onClose }: PersonalFoodLibraryProps) => {
  const [foods, setFoods] = useState<UserFood[]>([]);
  const [defaultFoods, setDefaultFoods] = useState<DefaultFood[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'defaults'>('personal');
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
      console.log('Loading default foods...');
      const { data, error } = await supabase
        .from('default_foods')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading default foods:', error);
        throw error;
      }
      
      console.log('Default foods loaded:', data?.length || 0, 'items');
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

  const copyToPersonalLibrary = async (defaultFood: DefaultFood) => {
    if (!user) return;
    
    try {
      // Check if food already exists in personal library
      const existingFood = foods.find(food => 
        food.name.toLowerCase() === defaultFood.name.toLowerCase()
      );
      
      if (existingFood) {
        toast({
          title: "Food already exists",
          description: "This food is already in your personal library",
          variant: "destructive"
        });
        return;
      }

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

      setFoods([...foods, data]);
      toast({
        title: "Food added",
        description: `${defaultFood.name} has been added to your personal library`
      });
    } catch (error) {
      console.error('Error copying food to personal library:', error);
      toast({
        title: "Error",
        description: "Failed to copy food to your library",
        variant: "destructive"
      });
    }
  };

  const filteredFoods = foods.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDefaultFoods = defaultFoods.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Food Library</h3>
        <Button variant="ghost" onClick={onClose} size="sm" className="h-12 w-12 p-0 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200">
          <X className="w-8 h-8" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'personal' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('personal')}
          className="flex-1"
        >
          My Foods ({foods.length})
        </Button>
        <Button
          variant={activeTab === 'defaults' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('defaults')}
          className="flex-1"
        >
          Common Foods ({defaultFoods.length})
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${activeTab === 'personal' ? 'your' : 'common'} foods...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted animate-pulse rounded-lg shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <div className="w-8 h-8 bg-muted animate-pulse rounded" />
                  <div className="w-8 h-8 bg-muted animate-pulse rounded" />
                  <div className="w-8 h-8 bg-muted animate-pulse rounded" />
                  <div className="w-16 h-8 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : activeTab === 'personal' ? (
        filteredFoods.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'No foods found matching your search' : 'No foods in your library yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Log foods to automatically add them to your library, or copy from Common Foods
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredFoods.map((food) => (
              <Card key={food.id} className="p-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                    {food.image_url ? (
                      <img 
                        src={food.image_url} 
                        alt={food.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-lg">🍽️</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate text-foreground">{food.name}</h4>
                      {food.is_favorite && (
                        <Heart className="w-3 h-3 text-red-500 fill-current shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-foreground/80">
                      {food.calories_per_100g} cal • {food.carbs_per_100g}g carbs • per 100g
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(food.id, food.is_favorite)}
                      className="h-8 w-8 p-0"
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
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 px-3"
                        >
                          Add
                          <ChevronDown className="w-3 h-3 ml-1" />
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
        )
      ) : (
        // Default foods tab
        filteredDefaultFoods.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'No common foods found matching your search' : 'No common foods available'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredDefaultFoods.map((food) => (
              <Card key={food.id} className="p-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                    {food.image_url ? (
                      <img 
                        src={food.image_url} 
                        alt={food.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-lg">🍽️</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate text-foreground">{food.name}</h4>
                    <p className="text-xs text-foreground/80">
                      {food.calories_per_100g} cal • {food.carbs_per_100g}g carbs • per 100g
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToPersonalLibrary(food)}
                      className="h-8 px-3 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 px-3"
                        >
                          Add
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSelectFood(food as UserFood, false)}>
                          Add to Shopping List
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSelectFood(food as UserFood, true)}>
                          Add to Eaten List
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
};