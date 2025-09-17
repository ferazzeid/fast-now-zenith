import React from 'react';
import { Sparkles, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AnalysisResult {
  name?: string;
  calories_per_100g?: number;
  carbs_per_100g?: number;
  protein_per_100g?: number;
  fat_per_100g?: number;
  estimated_serving_size?: number;
  confidence?: number;
  description?: string;
}

interface FoodAnalysisResultsProps {
  result: AnalysisResult;
  imageUrl: string;
  onConfirm: (data: AnalysisResult) => void;
  onReject: () => void;
  isLoading?: boolean;
}

export const FoodAnalysisResults = ({ 
  result, 
  imageUrl, 
  onConfirm, 
  onReject, 
  isLoading = false 
}: FoodAnalysisResultsProps) => {
  const confidence = result.confidence || 0;
  const isHighConfidence = confidence >= 0.7;
  
  // Calculate total nutritional values for the detected serving
  const servingSize = result.estimated_serving_size || 100;
  const totalCalories = Math.round((result.calories_per_100g || 0) * servingSize / 100);
  const totalCarbs = Math.round((result.carbs_per_100g || 0) * servingSize / 100 * 10) / 10;
  const totalProtein = Math.round((result.protein_per_100g || 0) * servingSize / 100 * 10) / 10;
  const totalFat = Math.round((result.fat_per_100g || 0) * servingSize / 100 * 10) / 10;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Food Detected!</CardTitle>
          </div>
          <Badge 
            variant={isHighConfidence ? "default" : "secondary"}
            className={isHighConfidence ? "bg-green-500/20 text-green-700 border-green-500/30" : ""}
          >
            {isHighConfidence ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
            {Math.round(confidence * 100)}% confident
          </Badge>
        </div>
        {result.description && (
          <CardDescription className="text-sm text-muted-foreground">
            {result.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Image thumbnail */}
        <div className="w-full h-32 rounded-lg overflow-hidden border-subtle bg-muted">
          <img 
            src={imageUrl} 
            alt="Analyzed food" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Detected food information */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-base text-foreground">
              {result.name || 'Unknown Food'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Estimated serving: {servingSize}g
            </p>
          </div>

          {/* Nutritional breakdown */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Calories:</span>
                <span className="font-medium">{totalCalories}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Carbs:</span>
                <span className="font-medium">{totalCarbs}g</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Protein:</span>
                <span className="font-medium">{totalProtein}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fat:</span>
                <span className="font-medium">{totalFat}g</span>
              </div>
            </div>
          </div>

          {/* Per 100g breakdown */}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Info className="w-3 h-3" />
              Per 100g breakdown
            </summary>
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span>Calories per 100g:</span>
                <span>{result.calories_per_100g || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Carbs per 100g:</span>
                <span>{result.carbs_per_100g || 0}g</span>
              </div>
              <div className="flex justify-between">
                <span>Protein per 100g:</span>
                <span>{result.protein_per_100g || 0}g</span>
              </div>
              <div className="flex justify-between">
                <span>Fat per 100g:</span>
                <span>{result.fat_per_100g || 0}g</span>
              </div>
            </div>
          </details>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onConfirm(result)}
            disabled={isLoading}
            className="flex-1"
            size="sm"
          >
            {isHighConfidence ? "Looks Good!" : "Use This"}
          </Button>
          <Button
            onClick={onReject}
            disabled={isLoading}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            Let Me Edit
          </Button>
        </div>

        {/* Confidence explanation */}
        {!isHighConfidence && (
          <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs">
            <AlertCircle className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-amber-800">
              <p className="font-medium">Lower confidence detection</p>
              <p>Please review the details before adding to your food list.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};