import { useState } from 'react';
import { X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ManualFoodEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  data: {
    name: string;
    servingSize: string;
    calories: string;
    carbs: string;
  };
  onDataChange: (data: any) => void;
}

export const ManualFoodEntry = ({ isOpen, onClose, onSave, data, onDataChange }: ManualFoodEntryProps) => {
  const updateField = (field: string, value: string) => {
    onDataChange({ ...data, [field]: value });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[85vh] mt-4">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Add Food Manually</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 p-1">
          {/* Required Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="food-name" className="text-sm font-medium">
                Food Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="food-name"
                value={data.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Grilled Chicken Breast"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="serving-size" className="text-sm font-medium">
                Serving Size (grams) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="serving-size"
                type="number"
                value={data.servingSize}
                onChange={(e) => updateField('servingSize', e.target.value)}
                placeholder="e.g., 150"
                className="mt-1"
                required
              />
            </div>
          </div>

          {/* Optional but Helpful Fields */}
          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              Optional (but helpful for accurate tracking):
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="calories" className="text-sm">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={data.calories}
                  onChange={(e) => updateField('calories', e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="carbs" className="text-sm">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={data.carbs}
                  onChange={(e) => updateField('carbs', e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={onSave} className="flex-1">
              Add to Food Plan
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};