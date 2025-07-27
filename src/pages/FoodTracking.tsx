import { useState } from 'react';
import { Camera, Plus, Save, History, Edit, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CompactImageUpload } from '@/components/CompactImageUpload';
import { PersonalFoodLibrary } from '@/components/PersonalFoodLibrary';
import { FoodHistory } from '@/components/FoodHistory';
import { EditFoodEntryModal } from '@/components/EditFoodEntryModal';
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
  const [consumedNow, setConsumedNow] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { addFoodEntry, updateFoodEntry, deleteFoodEntry, toggleConsumption, todayEntries, todayTotals } = useFoodEntries();

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
      // FIXED: Better error handling for food image analysis
      let errorMessage = "Please enter food details manually";
      if (error instanceof Error) {
        if (error.message.includes('OpenAI API key')) {
          errorMessage = "OpenAI API key required in Settings";
        } else if (error.message.includes('not authenticated')) {
          errorMessage = "Please sign in to use image analysis";
        } else if (error.message.includes('Invalid nutrition data')) {
          errorMessage = "Could not recognize this food. Try a clearer image or enter manually";
        } else {
          errorMessage = `Analysis failed: ${error.message}`;
        }
      }
      
      toast({
        title: "Image Analysis Failed", 
        description: errorMessage,
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
      image_url: imageUrl,
      consumed: consumedNow
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
      setConsumedNow(true);
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

  const handleUpdateFoodEntry = async (id: string, updates: any) => {
    const result = await updateFoodEntry(id, updates);
    if (result.error) {
      throw new Error(result.error.message);
    }
  };

  const handleDeleteFoodEntry = async (id: string) => {
    const result = await deleteFoodEntry(id);
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error.message
      });
    } else {
      toast({
        title: "Food deleted",
        description: "Food entry has been removed"
      });
    }
  };

  const handleToggleConsumption = async (entryId: string, consumed: boolean) => {
    const result = await toggleConsumption(entryId, consumed);
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error.message
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-md mx-auto pt-20 pb-20">{/* FIXED: Increased pt from 8 to 20 to prevent overlap */}
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div></div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Food Tracking
            </h1>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowHistory(true)}
              className="p-2"
            >
              <History className="w-5 h-5" />
            </Button>
          </div>
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

        {/* Quick Actions */}
        {!showForm && !showLibrary && (
          <div className="mb-8 space-y-6">
            {/* Main Action Buttons - Consistent Styling */}
            <div className="grid grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowForm(true)}
                className="h-16 flex-col space-y-1"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm">Manual</span>
              </Button>
              <CompactImageUpload onImageUpload={handleImageUpload} />
              <Button 
                variant="outline" 
                onClick={() => {/* TODO: Add voice entry */}}
                className="h-16 flex-col space-y-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="text-sm">Voice</span>
              </Button>
            </div>
            
            {/* My Foods - Different styling as suggested */}
            <Button 
              variant="secondary" 
              onClick={() => setShowLibrary(true)}
              className="w-full h-12 flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>My Foods Library</span>
            </Button>
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

            {/* Consumption Status */}
            <div className="space-y-2">
              <Label>Did you eat this now?</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={consumedNow ? "default" : "outline"}
                  size="sm"
                  onClick={() => setConsumedNow(true)}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Yes, eaten
                </Button>
                <Button
                  type="button"
                  variant={!consumedNow ? "default" : "outline"}
                  size="sm"
                  onClick={() => setConsumedNow(false)}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Just logging
                </Button>
              </div>
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
                  setConsumedNow(true);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Food History Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-auto">
              <FoodHistory onClose={() => setShowHistory(false)} />
            </div>
          </div>
        )}

        {/* Today's Food Entries - Enhanced UX */}
        {todayEntries.length > 0 && (
          <div>
            <h3 className="font-semibold mb-4 text-lg">Today's Food Diary</h3>
            <div className="space-y-3">
              {todayEntries.map((entry) => (
                <div key={entry.id} className={`p-4 rounded-xl bg-card border-2 transition-colors ${entry.consumed ? 'border-green-200 bg-gradient-to-r from-green-50/30 to-green-100/30 dark:border-green-700 dark:from-green-950/30 dark:to-green-900/30' : 'border-amber-200 bg-gradient-to-r from-amber-50/30 to-orange-100/30 dark:border-amber-700 dark:from-amber-950/30 dark:to-orange-900/30'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-lg truncate">{entry.name}</h4>
                        <div className={`text-xs px-2 py-1 rounded-full font-medium ${entry.consumed ? 'bg-green-500/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-600' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-600'}`}>
                          {entry.consumed ? '✓ Eaten' : '○ Ready to eat'}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {entry.serving_size}g • {entry.calories} cal • {entry.carbs}g carbs
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleConsumption(entry.id, !entry.consumed)}
                        className="p-2 hover:bg-primary/10"
                        title={entry.consumed ? "Mark as not eaten" : "Mark as eaten"}
                      >
                        {entry.consumed ? (
                          <X className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </Button>
                      <EditFoodEntryModal 
                        entry={entry} 
                        onUpdate={handleUpdateFoodEntry}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteFoodEntry(entry.id)}
                        className="p-2 hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
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