import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FoodLibraryView } from '@/components/FoodLibraryView';
import { useToast } from '@/hooks/use-toast';
import { useFoodEntriesQuery } from '@/hooks/optimized/useFoodEntriesQuery';
import { useDailyFoodTemplate } from '@/hooks/useDailyFoodTemplate';
import { SEOManager } from '@/components/SEOManager';

const MyFoods = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { addFoodEntry } = useFoodEntriesQuery();
  
  // Daily template functionality
  const { 
    templateFoods, 
    loading: templateLoading,
    saveAsTemplate,
    addToTemplate,
    clearTemplate,
    applyTemplate,
    loadTemplate: forceLoadTemplate,
    deleteTemplateFood
  } = useDailyFoodTemplate();

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
    <div className="relative min-h-[calc(100vh-80px)] bg-background overflow-x-hidden">
      <SEOManager />
      
      {/* Full Width Container */}
      <div className="max-w-md mx-auto pt-10 pb-40">
        <div className="flex items-center justify-between mb-6 px-4 mt-6">
          <h1 className="text-2xl font-bold">My Foods</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="px-4">
          <FoodLibraryView
          onSelectFood={handleSelectFood}
          onBack={handleBack}
          templateFoods={templateFoods}
          templateLoading={templateLoading}
          onSaveAsTemplate={saveAsTemplate}
          onAddToTemplate={addToTemplate}
          onClearTemplate={clearTemplate}
          onApplyTemplate={applyTemplate}
          onDeleteTemplateFood={deleteTemplateFood}
          onForceLoadTemplate={forceLoadTemplate}
          />
        </div>
      </div>
    </div>
  );
};

export default MyFoods;