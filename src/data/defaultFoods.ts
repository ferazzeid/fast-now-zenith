// Static default foods - bundled for instant access
// Last updated: 2025-09-15 from database extraction

export interface DefaultFood {
  id: string;
  name: string;
  calories_per_100g: number;
  carbs_per_100g: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_FOODS: DefaultFood[] = [
  {
    id: "bf4696dc-53c9-440d-a973-486f7df2cdc2",
    name: "Avocado",
    calories_per_100g: 175,
    carbs_per_100g: 8.5,
    image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/food-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755254530693_avocado-256.jpg",
    created_at: "2025-08-01T14:16:16.908188Z",
    updated_at: "2025-08-28T12:23:40.285252Z"
  },
  {
    id: "cfaf705c-f1de-4e76-888b-6558b47f3097",
    name: "Brie Cheese",
    calories_per_100g: 334,
    carbs_per_100g: 0.5,
    image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/food-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755251424875_soft-cheese-256.jpg",
    created_at: "2025-08-01T14:16:16.908188Z",
    updated_at: "2025-08-15T09:50:25.147469Z"
  },
  {
    id: "dcb0908e-bf4a-4a8b-9bd8-08690c72e8a4",
    name: "Camembert Cheese",
    calories_per_100g: 300,
    carbs_per_100g: 0.5,
    image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/food-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755251498878_soft-cheese-256.jpg",
    created_at: "2025-08-01T14:16:16.908188Z",
    updated_at: "2025-08-15T09:51:39.083373Z"
  },
  {
    id: "bf3ea19f-665f-4c63-bdd5-ba30cd8946dc",
    name: "Cucumber",
    calories_per_100g: 15,
    carbs_per_100g: 3.6,
    image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/food-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755254548895_cucumber-256.jpg",
    created_at: "2025-08-01T14:16:16.908188Z",
    updated_at: "2025-08-15T10:42:28.772731Z"
  },
  {
    id: "87914c9c-ba81-45e3-a938-17dec7be4722",
    name: "Egg",
    calories_per_100g: 143,
    carbs_per_100g: 0.7,
    image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/food-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755254564077_egg-256.jpg",
    created_at: "2025-08-01T14:16:16.908188Z",
    updated_at: "2025-08-15T10:42:44.506803Z"
  },
  {
    id: "863d4d5d-2d08-4993-a9a0-305722bf9060",
    name: "Fermented Pickles",
    calories_per_100g: 11,
    carbs_per_100g: 1.5,
    image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/food-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755254657371_pickles-256.jpg",
    created_at: "2025-08-01T14:16:16.908188Z",
    updated_at: "2025-08-15T10:44:17.754070Z"
  },
  {
    id: "a5ab9a40-eb64-4df0-9fea-45f5bd1e2a54",
    name: "Feta Cheese",
    calories_per_100g: 264,
    carbs_per_100g: 4,
    image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/food-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755254597977_feta-256.jpg",
    created_at: "2025-08-01T14:16:16.908188Z",
    updated_at: "2025-08-15T10:43:18.418818Z"
  },
  {
    id: "2c33dc7c-ce99-40f0-875b-d3b190968c64",
    name: "Greek Yogurt",
    calories_per_100g: 60,
    carbs_per_100g: 3.5,
    image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/food-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755254928552_jogurt-256.jpg",
    created_at: "2025-08-01T14:16:16.908188Z",
    updated_at: "2025-08-16T10:05:44.621277Z"
  },
  {
    id: "1f02c368-d2cb-445d-b565-99ddf1ea186a",
    name: "Ham",
    calories_per_100g: 300,
    carbs_per_100g: 1.5,
    image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/food-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755273010631_ham-256.jpg",
    created_at: "2025-08-01T14:16:16.908188Z",
    updated_at: "2025-08-16T10:03:08.610306Z"
  },
  {
    id: "5534e940-b0a1-44ca-99a3-c01ae9558a8a",
    name: "Light Cheese",
    calories_per_100g: 279,
    carbs_per_100g: 1,
    image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/food-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755254807091_hard-cheese-256.jpg",
    created_at: "2025-08-01T14:16:16.908188Z",
    updated_at: "2025-08-15T10:46:47.422136Z"
  },
  {
    id: "1e4e159c-dc44-4238-9d25-ef4ba3e8e180",
    name: "Minced Meat (beef)",
    calories_per_100g: 250,
    carbs_per_100g: 0,
    image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/food-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755254619052_minced-meat-256.jpg",
    created_at: "2025-08-01T14:16:16.908188Z",
    updated_at: "2025-08-15T10:43:39.389444Z"
  },
  {
    id: "9ce258cd-0c70-46f3-aba4-e8ba55d11263",
    name: "Pickles (non-fermented)",
    calories_per_100g: 12,
    carbs_per_100g: 2,
    image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/food-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755254817137_pickles-256.jpg",
    created_at: "2025-08-01T14:16:16.908188Z",
    updated_at: "2025-08-15T10:46:57.483402Z"
  },
  {
    id: "b4f6120c-9876-403c-a633-d28d40c4f33b",
    name: "Plain Yogurt",
    calories_per_100g: 61,
    carbs_per_100g: 4.7,
    image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/food-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755254629232_jogurt-256.jpg",
    created_at: "2025-08-01T14:16:16.908188Z",
    updated_at: "2025-08-15T10:43:49.202624Z"
  },
  {
    id: "ddb006a6-9323-4781-95da-fa25c8d53190",
    name: "Salmon Steak",
    calories_per_100g: 208,
    carbs_per_100g: 0,
    image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/food-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755254941406_smoked-steak-256.jpg",
    created_at: "2025-08-01T14:16:16.908188Z",
    updated_at: "2025-08-15T10:49:01.702043Z"
  },
  {
    id: "d2116056-73c6-41d8-94fc-e6d2ab8779c0",
    name: "Spinach",
    calories_per_100g: 18,
    carbs_per_100g: 3.9,
    image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/food-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755254951423_spinach-256.jpg",
    created_at: "2025-08-01T14:16:16.908188Z",
    updated_at: "2025-08-15T10:49:11.747578Z"
  },
  {
    id: "b5c6c92b-1234-4567-8901-23456789abcd",
    name: "Tomato",
    calories_per_100g: 18,
    carbs_per_100g: 3.9,
    image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/food-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755254960123_tomato-256.jpg",
    created_at: "2025-08-01T14:16:16.908188Z",
    updated_at: "2025-08-15T10:49:20.123456Z"
  }
];

// Version timestamp for cache busting
export const DEFAULT_FOODS_VERSION = "2025-09-15T11:28:21.000Z";

// Helper functions for default foods
export const getDefaultFoodByName = (name: string): DefaultFood | undefined => {
  return DEFAULT_FOODS.find(f => f.name.toLowerCase() === name.toLowerCase());
};

export const searchDefaultFoods = (query: string): DefaultFood[] => {
  if (!query.trim()) return DEFAULT_FOODS;
  
  const searchTerm = query.toLowerCase().trim();
  return DEFAULT_FOODS.filter(food => 
    food.name.toLowerCase().includes(searchTerm)
  ).sort((a, b) => {
    // Prioritize exact matches at the start of the name
    const aStartsWith = a.name.toLowerCase().startsWith(searchTerm);
    const bStartsWith = b.name.toLowerCase().startsWith(searchTerm);
    
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    // Then alphabetical order
    return a.name.localeCompare(b.name);
  });
};

export const getDefaultFoodsByCategory = (categoryFilter?: string): DefaultFood[] => {
  // Since default foods don't have explicit categories, we can filter by type
  if (!categoryFilter) return DEFAULT_FOODS;
  
  const lowercaseFilter = categoryFilter.toLowerCase();
  return DEFAULT_FOODS.filter(food => {
    const name = food.name.toLowerCase();
    switch (lowercaseFilter) {
      case 'dairy':
        return name.includes('cheese') || name.includes('yogurt');
      case 'meat':
        return name.includes('meat') || name.includes('ham') || name.includes('salmon');
      case 'vegetables':
        return name.includes('spinach') || name.includes('cucumber') || name.includes('tomato') || name.includes('pickle');
      case 'eggs':
        return name.includes('egg');
      default:
        return true;
    }
  });
};