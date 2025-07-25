import { useState } from 'react';
import { Camera, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ImageUpload';
import { PersonalFoodLibrary } from '@/components/PersonalFoodLibrary';
import { useToast } from '@/hooks/use-toast';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const FoodTracking = () => {
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [imageUrl, setImageUrl] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { addFoodEntry, todayEntries, todayTotals } = useFoodEntries();

  const handleImageUpload = async (url: string) => {
    setImageUrl(url);
    setShowForm(true);
    
    // Auto-analyze the food image
    try {
      const { data, error } = await supabase.functions.invoke('analyze-food-image', {
        body: { imageUrl: url }
      });

      if (error) {
        console.error('Food analysis error:', error);
        toast({
          title: "Analysis failed",
          description: "Please enter food details manually",
          variant: "destructive"
        });
        return;
      }

      if (data?.nutrition) {
        setFoodName(data.nutrition.name || '');
        setCalories(data.nutrition.calories?.toString() || '');
        setCarbs(data.nutrition.carbs?.toString() || '');
        setServingSize(data.nutrition.serving_size?.toString() || '100');
        
        toast({
          title: "Food analyzed!",
          description: "Check the details and adjust if needed"
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed", 
        description: "Please enter food details manually",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!foodName || !calories || !carbs) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in food name, calories, and carbs"
      });
      return;
    }

    const result = await addFoodEntry({
      name: foodName,
      calories: parseFloat(calories),
      carbs: parseFloat(carbs),
      serving_size: parseFloat(servingSize),
      image_url: imageUrl
    });

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error.message
      });
    } else {
      toast({
        title: "Food logged",
        description: `${foodName} has been added to your diary`
      });
      // Reset form
      setFoodName('');
      setCalories('');
      setCarbs('');
      setServingSize('100');
      setImageUrl('');
      setShowForm(false);
      
      // Save to personal library if not already there
      await saveToLibrary({
        name: foodName,
        calories: parseFloat(calories),
        carbs: parseFloat(carbs),
        serving_size: parseFloat(servingSize)
      });
    }
  };

  const saveToLibrary = async (entry: { name: string; calories: number; carbs: number; serving_size: number }) => {
    try {
      // Check if food already exists in library
      const { data: existing } = await supabase
        .from('user_foods')
        .select('id')
        .eq('user_id', user?.id)
        .eq('name', entry.name)
        .single();

      if (!existing) {
        // Calculate per 100g values
        const caloriesPer100g = (entry.calories / entry.serving_size) * 100;
        const carbsPer100g = (entry.carbs / entry.serving_size) * 100;

        await supabase
          .from('user_foods')
          .insert({
            user_id: user?.id,
            name: entry.name,
            calories_per_100g: caloriesPer100g,
            carbs_per_100g: carbsPer100g
          });
      }
    } catch (error) {
      // Silent error - don't interrupt user flow
      console.error('Error saving to library:', error);
    }
  };

  const handleSelectFromLibrary = (food: any) => {
    // Calculate values for 100g serving
    setFoodName(food.name);
    setCalories(food.calories_per_100g.toString());
    setCarbs(food.carbs_per_100g.toString());
    setServingSize('100');
    setShowLibrary(false);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-md mx-auto pt-8 pb-20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
            Food Tracking
          </h1>
          <p className="text-muted-foreground">Log your food intake</p>
        </div>

        {/* Today's Totals */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <div className="text-2xl font-bold text-primary">{todayTotals.calories}</div>
            <div className="text-sm text-muted-foreground">Calories</div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <div className="text-2xl font-bold text-secondary">{todayTotals.carbs}g</div>
            <div className="text-sm text-muted-foreground">Carbs</div>
          </div>
        </div>

        {/* Image Upload and Library */}
        {!showForm && !showLibrary && (
          <div className="mb-8">
            <ImageUpload 
              onImageUpload={handleImageUpload} 
              onImageRemove={() => setImageUrl('')}
            />
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowForm(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Manual Entry
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowLibrary(true)}
                className="w-full"
              >
                <Camera className="w-4 h-4 mr-2" />
                My Foods
              </Button>
            </div>
          </div>
        )}

        {/* Personal Food Library */}
        {showLibrary && (
          <div className="mb-8">
            <PersonalFoodLibrary
              onSelectFood={handleSelectFromLibrary}
              onClose={() => setShowLibrary(false)}
            />
          </div>
        )}

        {/* Food Entry Form */}
        {showForm && (
          <div className="space-y-4 mb-8">
            {imageUrl && (
              <div className="relative w-full h-32 rounded-lg overflow-hidden">
                <img src={imageUrl} alt="Food" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="foodName">Food Name</Label>
              <Input
                id="foodName"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="e.g., Apple, Chicken Breast"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="per serving"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="grams"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servingSize">Serving Size (g)</Label>
              <Input
                id="servingSize"
                type="number"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                placeholder="100"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save Food
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowForm(false);
                  setImageUrl('');
                  setFoodName('');
                  setCalories('');
                  setCarbs('');
                  setServingSize('100');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Today's Entries */}
        {todayEntries.length > 0 && (
          <div>
            <h3 className="font-semibold mb-4">Today's Foods</h3>
            <div className="space-y-2">
              {todayEntries.map((entry) => (
                <div key={entry.id} className="p-3 rounded-lg bg-card border border-border">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{entry.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {entry.serving_size}g serving
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div>{entry.calories} cal</div>
                      <div>{entry.carbs}g carbs</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodTracking;