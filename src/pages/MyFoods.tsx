import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    <div className="relative min-h-[calc(100vh-80px)] bg-background p-4 overflow-x-hidden">
      <SEOManager />
      
      <div className="max-w-md mx-auto pt-16 pb-32 safe-bottom">
        <div className="mt-6">
          <FoodLibraryView
            onSelectFood={handleSelectFood}
            onBack={handleBack}
          />
        </div>
      </div>
    </div>
  );
};

export default MyFoods;