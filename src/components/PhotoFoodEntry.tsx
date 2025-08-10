import React, { useState } from 'react';
import { Camera, Loader2, Sparkles, X, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UniversalModal } from '@/components/ui/universal-modal';
import { SimpleImageUpload } from '@/components/SimpleImageUpload';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { trackFoodEvent } from '@/utils/analytics';

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

interface PhotoFoodEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const PhotoFoodEntry = ({ isOpen, onClose, onSave }: PhotoFoodEntryProps) => {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form fields for manual adjustment
  const [name, setName] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');

  const handleUpload = async (url: string) => {
    setImageUrl(url);
    setResult(null);
    setError(null);
    await analyze(url);
  };

  const analyze = async (url: string) => {
    try {
      setAnalyzing(true);
      setError(null);
      const { data, error } = await supabase.functions.invoke('analyze-food-image', {
        body: { imageUrl: url },
      });
      if (error) throw error;
      
      const analysisResult = data as AnalysisResult;
      setResult(analysisResult);
      
      // Auto-populate form fields
      if (analysisResult.name) setName(analysisResult.name);
      if (analysisResult.estimated_serving_size) setServingSize(analysisResult.estimated_serving_size.toString());
      if (analysisResult.calories_per_100g && analysisResult.estimated_serving_size) {
        const totalCalories = Math.round((analysisResult.calories_per_100g * analysisResult.estimated_serving_size) / 100);
        setCalories(totalCalories.toString());
      }
      if (analysisResult.carbs_per_100g && analysisResult.estimated_serving_size) {
        const totalCarbs = Math.round((analysisResult.carbs_per_100g * analysisResult.estimated_serving_size) / 100);
        setCarbs(totalCarbs.toString());
      }
      
      toast({ title: 'Analysis complete', description: 'Food detected! Review and adjust if needed.' });
    } catch (e: any) {
      console.error('Analyze error', e);
      setError('Failed to analyze image');
      toast({ 
        title: 'Analysis failed', 
        description: 'Please try another photo or enter details manually.', 
        variant: 'destructive' 
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Food name required', variant: 'destructive' });
      return;
    }
    
    if (!calories || !carbs) {
      toast({ title: 'Calories and carbs are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const foodData = {
        name: name.trim(),
        serving_size: parseFloat(servingSize) || 100,
        calories: parseFloat(calories),
        carbs: parseFloat(carbs),
        consumed: false,
        image_url: imageUrl
      };
      
      await onSave(foodData);
      trackFoodEvent('add', 'image');
      
      // Reset form
      resetForm();
      onClose();
    } catch (error) {
      toast({ 
        title: 'Failed to save food', 
        description: 'Please try again.',
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setImageUrl(null);
    setResult(null);
    setError(null);
    setName('');
    setServingSize('');
    setCalories('');
    setCarbs('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleRetakePhoto = () => {
    setImageUrl(null);
    setResult(null);
    setError(null);
    setName('');
    setServingSize('');
    setCalories('');
    setCarbs('');
  };

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Photo Food Entry"
      size="lg"
    >
      <div className="space-y-6">
        {!imageUrl ? (
          <div className="space-y-4">
            <div className="text-center">
              <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-2">Take or Upload Food Photo</h3>
              <p className="text-sm text-muted-foreground">
                Upload a photo and our AI will analyze the nutritional information for you
              </p>
            </div>
            <SimpleImageUpload onImageUpload={handleUpload} />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="aspect-video w-full max-h-[40vh] overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
              <img 
                src={imageUrl} 
                alt="Food photo for analysis" 
                className="w-full h-full object-contain" 
                loading="lazy" 
              />
            </div>

            {/* Analysis Status */}
            {analyzing && (
              <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                <span className="text-sm">Analyzing nutritional information...</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Analysis Results and Form */}
            {result && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">AI Analysis</span>
                  {result.confidence && (
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(result.confidence * 100)}% confidence
                    </Badge>
                  )}
                </div>
                {result.description && (
                  <p className="text-xs text-muted-foreground">{result.description}</p>
                )}
              </div>
            )}

            {/* Editable Form Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Food Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter food name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="servingSize">Serving Size (g)</Label>
                  <Input
                    id="servingSize"
                    type="number"
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="Enter calories"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="carbs">Carbohydrates (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="Enter carbs"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => imageUrl && analyze(imageUrl)}
                disabled={analyzing}
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Re-analyze
              </Button>
              <Button
                variant="action-secondary"
                onClick={handleRetakePhoto}
                className="flex-1"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                New Photo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={handleClose} className="flex-1">
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        {imageUrl && (
          <Button 
            onClick={handleSave} 
            disabled={saving || !name || !calories || !carbs}
            className="flex-1"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Camera className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Adding...' : 'Add to Food Plan'}
          </Button>
        )}
      </div>
    </UniversalModal>
  );
};