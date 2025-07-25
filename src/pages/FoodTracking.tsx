import { useState } from 'react';
import { Camera, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { useFoodEntries } from '@/hooks/useFoodEntries';

const FoodTracking = () => {
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [imageUrl, setImageUrl] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const { addFoodEntry, todayEntries, todayTotals } = useFoodEntries();

  const handleImageUpload = (url: string) => {
    setImageUrl(url);
    // TODO: Integrate AI to analyze the image and populate fields
    setShowForm(true);
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
    }
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

        {/* Image Upload */}
        {!showForm && (
          <div className="mb-8">
            <ImageUpload 
              onImageUpload={handleImageUpload} 
              onImageRemove={() => setImageUrl('')}
            />
            <div className="text-center mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowForm(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Manual Entry
              </Button>
            </div>
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