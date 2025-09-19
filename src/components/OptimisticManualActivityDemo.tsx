/**
 * DEMO: Optimistic Manual Activity Management
 * Shows instant UI updates with real-time sync
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOptimizedManualCalorieBurns } from '@/hooks/optimized/useOptimizedManualCalorieBurns';
import { Plus, X, Loader2 } from 'lucide-react';
import { useRealtimeDeficit } from '@/contexts/RealtimeDeficitContext';

export const OptimisticManualActivityDemo: React.FC = () => {
  const { 
    manualBurns, 
    todayTotal, 
    addManualBurn, 
    deleteManualBurn, 
    isAddingBurn, 
    isDeletingBurn,
    loading 
  } = useOptimizedManualCalorieBurns();

  const { isSubscribedToManualBurns } = useRealtimeDeficit();
  
  const [activityName, setActivityName] = useState('');
  const [calories, setCalories] = useState('');

  const handleAddActivity = () => {
    if (!activityName.trim() || !calories || isNaN(Number(calories))) return;
    
    addManualBurn({
      activity_name: activityName.trim(),
      calories_burned: Number(calories),
    });
    
    // Clear form
    setActivityName('');
    setCalories('');
  };

  const handleDeleteActivity = (burnId: string) => {
    deleteManualBurn(burnId);
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">External Activities</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className={`w-2 h-2 rounded-full ${isSubscribedToManualBurns ? 'bg-green-500' : 'bg-gray-400'}`} />
          {isSubscribedToManualBurns ? 'Real-time' : 'Cached'}
        </div>
      </div>
      
      {/* Add Activity Form */}
      <div className="flex gap-2">
        <Input
          placeholder="Activity name"
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="Calories"
          type="number"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          className="w-20"
        />
        <Button 
          onClick={handleAddActivity}
          disabled={!activityName.trim() || !calories || isAddingBurn}
          size="sm"
        >
          {isAddingBurn ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Today's Total */}
      <div className="flex justify-between items-center py-2 border-t">
        <span className="text-sm font-medium">Today's Total:</span>
        <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
          {todayTotal} cal
        </span>
      </div>

      {/* Activities List */}
      {manualBurns.length > 0 && (
        <div className="space-y-2">
          {manualBurns.map((burn) => (
            <div 
              key={burn.id} 
              className={`flex items-center justify-between py-2 px-3 rounded border ${
                burn.id.startsWith('temp-') ? 'bg-blue-50 border-blue-200 opacity-75' : 'bg-background'
              }`}
            >
              <div className="flex-1">
                <span className="text-sm">{burn.activity_name}</span>
                {burn.id.startsWith('temp-') && (
                  <span className="text-xs text-blue-600 ml-2">(syncing...)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-mono">
                  {burn.calories_burned} cal
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteActivity(burn.id)}
                  disabled={isDeletingBurn}
                  className="h-6 w-6 p-0 hover:bg-destructive/10"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {manualBurns.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No external activities added today
        </div>
      )}
    </Card>
  );
};