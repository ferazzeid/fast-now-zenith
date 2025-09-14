import { useState } from 'react';
import { X, Camera, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UniversalModal } from '@/components/ui/universal-modal';

interface ImageFoodAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  data: {
    name: string;
    servingSize: string;
    calories: string;
    carbs: string;
    imageUrl: string;
  };
  onDataChange: (data: any) => void;
}

export const ImageFoodAnalysis = ({ isOpen, onClose, onSave, data, onDataChange }: ImageFoodAnalysisProps) => {
  const updateField = (field: string, value: string) => {
    onDataChange({ ...data, [field]: value });
  };

  const hasAiAnalysis = data.name || data.calories || data.carbs;

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={hasAiAnalysis ? 'AI Food Analysis' : 'Food from Image'}
      size="md"
      footer={
        <div className="flex gap-2 w-full">
          <Button onClick={onSave} className="flex-1">
            Add to Food Plan
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >

      <div className="space-y-4 p-1">
        {/* Image Preview */}
        {data.imageUrl && (
          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
            <img 
              src={data.imageUrl} 
              alt="Food" 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* AI Analysis Message */}
        {hasAiAnalysis && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm font-medium">AI Analysis Complete</p>
            </div>
            <p className="text-xs text-green-600 dark:text-green-300 mt-1">
              I've analyzed your image and estimated the nutritional values. The serving size estimate is based on visual analysis - please adjust if you consumed more/less than shown.
            </p>
          </div>
        )}

        {!hasAiAnalysis && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <p className="text-sm font-medium">Analysis Incomplete</p>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
              I couldn't recognize this food from the image. Please enter the food details manually below.
            </p>
          </div>
        )}

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
            <p className="text-xs text-muted-foreground mb-1">
              Adjust this if you consumed more/less than what's shown in the image
            </p>
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

        {/* Estimated Values */}
        <div className="pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            {hasAiAnalysis ? 'AI Estimated Values (for serving):' : 'Nutritional Information (for serving):'}
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="calories" className="text-sm">Calories (for this serving)</Label>
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
              <Label htmlFor="carbs" className="text-sm">Carbs (g, for this serving)</Label>
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

        {/* Workflow Info */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            This will add {data.name || 'this food'} ({data.servingSize || '0'}g) to your food plan.
          </p>
        </div>
      </div>
    </UniversalModal>
  );
};