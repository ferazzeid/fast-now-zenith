import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X, Edit } from 'lucide-react';
import { FoodEditPreview as FoodEditPreviewType } from '@/hooks/useFoodEditingActions';

interface FoodEditPreviewProps {
  preview: FoodEditPreviewType;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit: () => void;
}

export const FoodEditPreview: React.FC<FoodEditPreviewProps> = ({
  preview,
  onConfirm,
  onCancel,
  onEdit
}) => {
  const formatValue = (key: string, value: number) => {
    if (key === 'serving_size') return `${value}g`;
    if (key === 'calories' || key === 'calories_per_100g') return `${value} cal`;
    if (key === 'carbs' || key === 'carbs_per_100g') return `${value}g carbs`;
    return `${value}`;
  };

  const getChanges = () => {
    const changes: Array<{ key: string; before: number; after: number }> = [];
    
    Object.keys(preview.after).forEach(key => {
      if (preview.after[key] !== preview.before[key] && typeof preview.after[key] === 'number') {
        changes.push({
          key,
          before: preview.before[key],
          after: preview.after[key]
        });
      }
    });
    
    return changes;
  };

  const changes = getChanges();

  if (changes.length === 0) return null;

  return (
    <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-warm-text">Edit Preview: {preview.name}</h4>
          <div className="text-xs text-muted-foreground bg-ceramic-base px-2 py-1 rounded">
            {preview.type === 'today' ? "Today's Entry" : 
             preview.type === 'library' ? 'Food Library' : 'Template'}
          </div>
        </div>
        
        <div className="space-y-2">
          {changes.map(({ key, before, after }) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="capitalize text-warm-text">
                {key.replace('_', ' ').replace('per 100g', '/100g')}:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground line-through">
                  {formatValue(key, before)}
                </span>
                <span className="text-xs text-muted-foreground">→</span>
                <span className="text-primary font-medium">
                  {formatValue(key, after)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            onClick={onConfirm}
            className="flex-1"
          >
            <Check className="w-3 h-3 mr-1" />
            Apply Changes
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onEdit}
            className="px-3"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onCancel}
            className="px-3"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};