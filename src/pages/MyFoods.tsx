import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FoodLibraryView } from '@/components/FoodLibraryView';
import { useToast } from '@/hooks/use-toast';
import { useFoodEntriesQuery } from '@/hooks/optimized/useFoodEntriesQuery';
import { SEOManager } from '@/components/SEOManager';

const MyFoods = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { addFoodEntry } = useFoodEntriesQuery();

  // SEO optimization
  useEffect(() => {
    document.title = 'My Foods - FastNow';
  }, []);

  const handleSelectFood = async (food: any, consumed = false) => {
    try {
      // Convert food to proper format for addFoodEntry
      const foodEntry = {
        name: food.name,
        calories: food.calories_per_100g || food.calories,
        carbs: food.carbs_per_100g || food.carbs,
        serving_size: 100,
        consumed: consumed,
        image_url: food.image_url
      };
      
      // Add the food entry (optimistic updates already handle UI refresh)
      await addFoodEntry(foodEntry);
      
      // Show success feedback
      toast({
        title: "Food added",
        description: `${food.name} added to today's list`,
      });

      // Navigate back to food tracking page
      navigate('/food-tracking');
    } catch (error) {
      // Error is already handled by the mutation, just log it
      console.error('Error adding food from library:', error);
    }
  };

  const handleBack = () => {
    const returnTo = searchParams.get('returnTo') || '/food-tracking';
    navigate(returnTo);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEOManager />
      
      {/* Modal-like Container */}
      <div className="max-w-md mx-auto p-4 pt-20 pb-8">
        <div className="bg-background rounded-xl shadow-sm border">
          {/* Header inside the box */}
          <div className="px-6 py-4 border-b rounded-t-xl flex items-center justify-between">
            <h1 className="text-lg font-semibold">My Foods</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="p-6">
            <FoodLibraryView
              onSelectFood={handleSelectFood}
              onBack={handleBack}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyFoods;