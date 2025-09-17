// Smart nutrition calculation utilities with per-100g data handling

export interface FoodNutritionData {
  calories_per_100g?: number;
  carbs_per_100g?: number;
  protein_per_100g?: number;
  fat_per_100g?: number;
}

export interface EnhancedFoodItem {
  name: string;
  serving_size: number; // in grams (master field)
  calories: number;
  carbs: number;
  // Per-100g nutritional density data
  calories_per_100g?: number;
  carbs_per_100g?: number;
  protein_per_100g?: number;
  fat_per_100g?: number;
  // Flags to track manual overrides
  calories_manually_set?: boolean;
  carbs_manually_set?: boolean;
  // Optional fields
  protein?: number;
  fat?: number;
}

/**
 * Calculate nutritional values from weight and per-100g data
 */
export const calculateNutritionFromWeight = (
  weightGrams: number,
  nutritionPer100g: FoodNutritionData
): { calories: number; carbs: number; protein: number; fat: number } => {
  const factor = weightGrams / 100;
  
  return {
    calories: Math.round((nutritionPer100g.calories_per_100g || 0) * factor),
    carbs: Math.round((nutritionPer100g.carbs_per_100g || 0) * factor * 10) / 10, // Round to 1 decimal
    protein: Math.round((nutritionPer100g.protein_per_100g || 0) * factor * 10) / 10,
    fat: Math.round((nutritionPer100g.fat_per_100g || 0) * factor * 10) / 10
  };
};

/**
 * Calculate per-100g rates from current totals and weight
 * Used as fallback when per-100g data is not available
 */
export const calculatePer100gFromTotals = (
  weightGrams: number,
  calories: number,
  carbs: number,
  protein?: number,
  fat?: number
): FoodNutritionData => {
  if (weightGrams <= 0) {
    return { calories_per_100g: 0, carbs_per_100g: 0, protein_per_100g: 0, fat_per_100g: 0 };
  }
  
  const factor = 100 / weightGrams;
  
  return {
    calories_per_100g: Math.round(calories * factor),
    carbs_per_100g: Math.round(carbs * factor * 10) / 10,
    protein_per_100g: protein ? Math.round(protein * factor * 10) / 10 : 0,
    fat_per_100g: fat ? Math.round(fat * factor * 10) / 10 : 0
  };
};

/**
 * Update food item with smart recalculation logic
 */
export const updateFoodItemWithRecalculation = (
  currentFood: EnhancedFoodItem,
  updates: Partial<EnhancedFoodItem>
): EnhancedFoodItem => {
  const updatedFood = { ...currentFood, ...updates };
  
  // If weight (serving_size) changed and we have per-100g data
  if (updates.serving_size !== undefined && 
      (currentFood.calories_per_100g || currentFood.carbs_per_100g)) {
    
    // Only recalculate values that haven't been manually overridden
    const nutritionPer100g: FoodNutritionData = {
      calories_per_100g: currentFood.calories_per_100g,
      carbs_per_100g: currentFood.carbs_per_100g,
      protein_per_100g: currentFood.protein_per_100g,
      fat_per_100g: currentFood.fat_per_100g
    };
    
    const calculatedNutrition = calculateNutritionFromWeight(updates.serving_size, nutritionPer100g);
    
    // Only update values that haven't been manually set
    if (!currentFood.calories_manually_set) {
      updatedFood.calories = calculatedNutrition.calories;
    }
    if (!currentFood.carbs_manually_set) {
      updatedFood.carbs = calculatedNutrition.carbs;
    }
    if (currentFood.protein !== undefined && currentFood.protein_per_100g) {
      updatedFood.protein = calculatedNutrition.protein;
    }
    if (currentFood.fat !== undefined && currentFood.fat_per_100g) {
      updatedFood.fat = calculatedNutrition.fat;
    }
  }
  
  // If calories or carbs were manually updated, mark them as manually set
  if (updates.calories !== undefined && updates.calories !== currentFood.calories) {
    updatedFood.calories_manually_set = true;
  }
  if (updates.carbs !== undefined && updates.carbs !== currentFood.carbs) {
    updatedFood.carbs_manually_set = true;
  }
  
  // If we don't have per-100g data, calculate it from current values
  if (!updatedFood.calories_per_100g && updatedFood.serving_size > 0) {
    const per100g = calculatePer100gFromTotals(
      updatedFood.serving_size,
      updatedFood.calories,
      updatedFood.carbs,
      updatedFood.protein,
      updatedFood.fat
    );
    Object.assign(updatedFood, per100g);
  }
  
  return updatedFood;
};

/**
 * Reset manual override flags to enable automatic calculation
 */
export const resetToCalculatedValues = (food: EnhancedFoodItem): EnhancedFoodItem => {
  const resetFood = {
    ...food,
    calories_manually_set: false,
    carbs_manually_set: false
  };
  
  // Recalculate all values from per-100g data if available
  if (food.calories_per_100g || food.carbs_per_100g) {
    const nutritionPer100g: FoodNutritionData = {
      calories_per_100g: food.calories_per_100g,
      carbs_per_100g: food.carbs_per_100g,
      protein_per_100g: food.protein_per_100g,
      fat_per_100g: food.fat_per_100g
    };
    
    const calculated = calculateNutritionFromWeight(food.serving_size, nutritionPer100g);
    return {
      ...resetFood,
      calories: calculated.calories,
      carbs: calculated.carbs,
      protein: calculated.protein,
      fat: calculated.fat
    };
  }
  
  return resetFood;
};

/**
 * Check if nutrition values are automatically calculated
 */
export const isNutritionCalculated = (food: EnhancedFoodItem): {
  calories: boolean;
  carbs: boolean;
} => {
  return {
    calories: !food.calories_manually_set && !!food.calories_per_100g,
    carbs: !food.carbs_manually_set && !!food.carbs_per_100g
  };
};