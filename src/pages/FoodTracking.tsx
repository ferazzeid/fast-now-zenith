import { useState } from 'react';
import { Plus, Save, History, Edit, Trash2, Check, X, Mic, Info, Footprints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PersonalFoodLibrary } from '@/components/PersonalFoodLibrary';
import { FoodHistory } from '@/components/FoodHistory';
import { EditFoodEntryModal } from '@/components/EditFoodEntryModal';
import { ModalAiChat } from '@/components/ModalAiChat';
import { ManualFoodEntry } from '@/components/ManualFoodEntry';
import { PremiumGate } from '@/components/PremiumGate';
import { ComponentErrorBoundary } from '@/components/ErrorBoundary';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { useFoodWalkingCalculation } from '@/hooks/useFoodWalkingCalculation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const FoodTracking = () => {
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [showForm, setShowForm] = useState(false);
  const [consumedNow, setConsumedNow] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [manualEntryData, setManualEntryData] = useState({
    name: '',
    servingSize: '',
    calories: '',
    carbs: ''
  });
  const [aiChatContext, setAiChatContext] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const { addFoodEntry, updateFoodEntry, deleteFoodEntry, toggleConsumption, todayEntries, todayTotals } = useFoodEntries();
  const { calculateWalkingMinutesForFood, formatWalkingTime } = useFoodWalkingCalculation();

  const handleVoiceFood = () => {
    const contextMessage = `Hello! I'm here to help you add food to your nutrition log. 

To add a food item, I'll need:
• Food name (what did you eat?)
• Portion size in grams 
• Calories (I can estimate if needed)
• Carbs in grams (I can estimate if needed)

Please tell me what food you'd like to add and how much you had. For example: "I had 150 grams of grilled chicken breast" or "I ate a medium apple, about 180 grams".`;
    
    setAiChatContext(contextMessage);
    setShowAiChat(true);
  };

  const handleAiChatResult = async (result: any) => {
    if (result.name === 'add_food_entry') {
      const { arguments: args } = result;
      
      // Add the food entry from AI suggestion
      const foodResult = await addFoodEntry({
        name: args.name,
        calories: parseFloat(args.calories),
        carbs: parseFloat(args.carbs),
        serving_size: parseFloat(args.serving_size),
        consumed: args.consumed || false
      });

      if (foodResult.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: foodResult.error.message
        });
      } else {
        toast({
          title: "✅ Food Added Successfully!",
          description: `${args.name} has been added to your food plan`
        });
        
        // Close the AI chat modal after a brief delay
        setTimeout(() => {
          setShowAiChat(false);
        }, 1500);
        
        // Save to personal library
        await saveToLibrary({
          name: args.name,
          calories: parseFloat(args.calories),
          carbs: parseFloat(args.carbs),
          serving_size: parseFloat(args.serving_size)
        });
      }
    }
  };

  const handleManualEntry = () => {
    setManualEntryData({
      name: '',
      servingSize: '',
      calories: '',
      carbs: ''
    });
    setShowManualEntry(true);
  };


  const handleSaveManualEntry = async () => {
    if (!manualEntryData.name.trim() || !manualEntryData.servingSize.trim()) {
      toast({
        variant: "destructive",
        title: "Missing required information",
        description: "Please enter food name and serving size"
      });
      return;
    }

    let calories = parseFloat(manualEntryData.calories) || 0;
    let carbs = parseFloat(manualEntryData.carbs) || 0;

    // Convert per-100g values to actual serving calories/carbs for food plan
    const servingGrams = parseFloat(manualEntryData.servingSize);
    const per100gCalories = parseFloat(manualEntryData.calories) || 0;
    const per100gCarbs = parseFloat(manualEntryData.carbs) || 0;
    
    // Calculate actual consumption based on serving size
    calories = (per100gCalories * servingGrams) / 100;
    carbs = (per100gCarbs * servingGrams) / 100;

    // If per-100g values are missing, get them from AI
    if (per100gCalories === 0 || per100gCarbs === 0) {
      try {
        const { data, error } = await supabase.functions.invoke('chat-completion', {
          body: {
            messages: [
              {
                role: 'system',
                content: 'You are a nutrition expert. Provide nutritional information for foods. Return only a JSON object with calories_per_100g and carbs_per_100g as numbers.'
              },
              {
                role: 'user',
                content: `What are the calories and carbs per 100g for ${manualEntryData.name}? Return only JSON format: {"calories_per_100g": number, "carbs_per_100g": number}`
              }
            ]
          }
        });

        if (data?.content) {
          try {
            const nutritionData = JSON.parse(data.content);
            
            if (per100gCalories === 0 && nutritionData.calories_per_100g) {
              calories = (nutritionData.calories_per_100g * servingGrams) / 100;
            }
            if (per100gCarbs === 0 && nutritionData.carbs_per_100g) {
              carbs = (nutritionData.carbs_per_100g * servingGrams) / 100;
            }
          } catch (parseError) {
            console.error('Failed to parse AI nutrition response:', parseError);
          }
        }
      } catch (error) {
        console.error('Failed to get AI nutrition data:', error);
      }
    }

    const result = await addFoodEntry({
      name: manualEntryData.name,
      calories: Math.round(calories * 100) / 100,
      carbs: Math.round(carbs * 100) / 100,
      serving_size: parseFloat(manualEntryData.servingSize),
      consumed: false
    });

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error.message
      });
    } else {
      toast({
        title: "Food added successfully!",
        description: `${manualEntryData.name} has been added to your food plan`
      });
      setShowManualEntry(false);
      
      // Save to personal library (with per-100g values)
      await saveToLibrary({
        name: manualEntryData.name,
        calories: parseFloat(manualEntryData.calories) || 0, // This is already per 100g
        carbs: parseFloat(manualEntryData.carbs) || 0, // This is already per 100g
        serving_size: 100 // Always save as per 100g in library
      });
      
      toast({
        title: "Added to library too!",
        description: `${manualEntryData.name} saved for future use`
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
        // If serving_size is 100, values are already per 100g
        // Otherwise, calculate per 100g values
        const caloriesPer100g = entry.serving_size === 100 
          ? entry.calories 
          : (entry.calories / entry.serving_size) * 100;
        const carbsPer100g = entry.serving_size === 100 
          ? entry.carbs 
          : (entry.carbs / entry.serving_size) * 100;

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

  const handleSelectFromLibrary = (food: any, consumed: boolean = false) => {
    // Calculate values for 100g serving
    setFoodName(food.name);
    setCalories(food.calories_per_100g.toString());
    setCarbs(food.carbs_per_100g.toString());
    setServingSize('100');
    setConsumedNow(consumed);
    setShowLibrary(false);
    
    // If consumed is true, directly save to food entries as consumed
    // If false, show the form for editing/planning
    if (consumed) {
      handleSave(); // This will save as consumed=true 
    } else {
      setShowForm(true);
    }
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

        {/* Today's Nutrition Overview */}
        <TooltipProvider>
          <div className="mb-8 p-4 rounded-xl bg-ceramic-plate border border-ceramic-rim">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="text-center">
                <div className="text-xl font-bold text-warm-text">{todayTotals.calories}</div>
                <div className="text-xs font-medium text-warm-text">
                  Consumed Calories
                  <div className="text-xs text-warm-text/70 mt-1">today</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-warm-text">{todayTotals.carbs}g</div>
                <div className="text-xs font-medium text-warm-text">
                  Consumed Carbs
                  <div className="text-xs text-warm-text/70 mt-1">today</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded bg-ceramic-base">
                <div className="text-sm font-semibold text-warm-text">{todayEntries.reduce((sum, entry) => sum + entry.calories, 0)}</div>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs font-medium text-warm-text">Planned Cal</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-warm-text/60" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-48">Calories planned to be consumed today, often from go-to food items</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="p-2 rounded bg-ceramic-base">
                <div className="text-sm font-semibold text-warm-text">{todayEntries.reduce((sum, entry) => sum + entry.carbs, 0)}g</div>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs font-medium text-warm-text">Planned Carbs</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-warm-text/60" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-48">Carbs calculated from planned food items in your daily plan</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="p-2 rounded bg-ceramic-base">
                <div className="text-sm font-semibold text-warm-text">2000</div>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs font-medium text-warm-text">Cal Limit</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-warm-text/60" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-48">Ideally you shouldn't go higher than this value for the day. Not a hard stop but ideal for long-term results.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="p-2 rounded bg-ceramic-base">
                <div className="text-sm font-semibold text-warm-text">150g</div>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs font-medium text-warm-text">Carb Limit</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-warm-text/60" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-48">Sensitive value especially for ketosis. Critical to respect daily for best results - highly advisable.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </TooltipProvider>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Voice - 1st */}
          <PremiumGate feature="AI Voice Assistant">
            <Button
              onClick={handleVoiceFood}
              className="h-20 flex flex-col items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Mic className="w-6 h-6 mb-1" />
              <span className="text-sm font-medium">Voice Add Food</span>
            </Button>
          </PremiumGate>
          
          
          {/* Manual - 3rd */}
          <Button
            onClick={handleManualEntry}
            className="h-20 flex flex-col items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-6 h-6 mb-1" />
            <span className="text-sm font-medium">Manual Add Food</span>
          </Button>
        </div>

        {/* My Foods Library Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowLibrary(!showLibrary)}
            className="w-full h-12 flex items-center justify-center border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 bg-background/50"
          >
            <svg className="w-5 h-5 mr-2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="text-muted-foreground font-medium">My Foods Library</span>
          </Button>
        </div>

        {/* Personal Food Library */}
        {showLibrary && (
          <div className="mb-6 bg-card border border-border rounded-lg p-4">
            <ComponentErrorBoundary>
              <PersonalFoodLibrary
                onSelectFood={handleSelectFromLibrary}
                onClose={() => setShowLibrary(false)}
              />
            </ComponentErrorBoundary>
          </div>
        )}


        {/* Food Entry Form */}
        {showForm && (
          <div className="space-y-4 mb-8">
            
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
              <Label className="text-sm text-muted-foreground">Status</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={consumedNow ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setConsumedNow(true)}
                  className="flex-1 h-8 text-xs bg-secondary/20 hover:bg-secondary/30"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Eaten
                </Button>
                <Button
                  type="button"
                  variant={!consumedNow ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setConsumedNow(false)}
                  className="flex-1 h-8 text-xs bg-secondary/20 hover:bg-secondary/30"
                >
                  <X className="w-3 h-3 mr-1" />
                  Planning
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1 h-12 text-base font-semibold">
                <Save className="w-5 h-5 mr-2" />
                Add to Today's List
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowForm(false);
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

        {/* Manual Food Entry Modal */}
        <ComponentErrorBoundary>
          <ManualFoodEntry
            isOpen={showManualEntry}
            onClose={() => setShowManualEntry(false)}
            onSave={handleSaveManualEntry}
            data={manualEntryData}
            onDataChange={setManualEntryData}
          />
        </ComponentErrorBoundary>


        {/* AI Chat Modal */}
        <PremiumGate feature="AI Chat Assistant" showUpgrade={false}>
          <ComponentErrorBoundary>
            <ModalAiChat
              isOpen={showAiChat}
              onClose={() => setShowAiChat(false)}
              onResult={handleAiChatResult}
              context={aiChatContext}
              title="Food Assistant"
              systemPrompt="You are a nutrition assistant helping users log food entries. Always ensure complete information: food name, portion size in grams, calories, and carbs. Provide reasonable estimates when exact values aren't known."
            />
          </ComponentErrorBoundary>
        </PremiumGate>

        {/* Food History Modal */}
        {showHistory && (
          <ComponentErrorBoundary>
            <FoodHistory onClose={() => setShowHistory(false)} />
          </ComponentErrorBoundary>
        )}

        {/* Today's Food Plan */}
        {todayEntries.length > 0 && (
          <div>
            <h3 className="font-semibold mb-4 text-lg">Today's Food Plan</h3>
            <div className="space-y-3">
              {todayEntries.map((entry) => (
                <div key={entry.id} className={`p-2 rounded-lg bg-ceramic-plate border border-ceramic-rim transition-colors ${entry.consumed ? 'border-green-300 bg-green-50/10' : 'border-amber-300 bg-amber-50/10'}`}>
                  <div className="flex items-center gap-2">
                    {/* Food Image */}
                    <div className="w-8 h-8 rounded bg-ceramic-base flex items-center justify-center flex-shrink-0">
                      <div className="w-4 h-4 bg-warm-text/20 rounded flex items-center justify-center">
                        <span className="text-xs text-warm-text/60">🍽️</span>
                      </div>
                    </div>
                    
                     {/* Food Info */}
                     <div className="flex-1 min-w-0">
                       {/* First Line: Food name only */}
                       <div className="flex items-center">
                         <span className="font-medium text-warm-text truncate flex-1">{entry.name}</span>
                       </div>
                       {/* Second Line: All data including walking time */}
                       <div className="flex items-center gap-1 text-xs text-warm-text/80 mt-1">
                         <span>{entry.serving_size}g</span>
                         <span className="text-warm-text/60">•</span>
                         <span>{entry.calories}cal</span>
                         <span className="text-warm-text/60">•</span>
                         <span>{entry.carbs}g carbs</span>
                         <span className="text-warm-text/60">•</span>
                         <div className="flex items-center gap-1">
                           <Footprints className="w-3 h-3" />
                           <span>{formatWalkingTime(calculateWalkingMinutesForFood(entry.calories))}</span>
                         </div>
                       </div>
                     </div>
                    
                    {/* Status & Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${entry.consumed ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
                        {entry.consumed ? '✓' : '○'}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleConsumption(entry.id, !entry.consumed)}
                        className="p-1 h-6 w-6 hover:bg-primary/10"
                        title={entry.consumed ? "Mark as planned" : "Mark as eaten"}
                      >
                        {entry.consumed ? (
                          <X className="w-3 h-3 text-amber-600" />
                        ) : (
                          <Check className="w-3 h-3 text-green-600" />
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
                        className="p-1 h-6 w-6 hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
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