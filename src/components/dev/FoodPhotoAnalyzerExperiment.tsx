import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleImageUpload } from '@/components/SimpleImageUpload';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Image as ImageIcon, RefreshCcw } from 'lucide-react';

interface AnalysisResult {
  name?: string;
  calories_per_100g?: number;
  carbs_per_100g?: number;
  protein_per_100g?: number;
  fat_per_100g?: number;
  estimated_serving_size?: number;
  confidence?: number;
  description?: string;
  [key: string]: any;
}

export const FoodPhotoAnalyzerExperiment: React.FC = () => {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (url: string) => {
    setImageUrl(url);
    setResult(null);
    setError(null);
    await analyze(url);
  };

  const analyze = async (url: string) => {
    try {
      setAnalyzing(true);
      const { data, error } = await supabase.functions.invoke('analyze-food-image', {
        body: { imageUrl: url },
      });
      if (error) throw error;
      setResult(data as AnalysisResult);
      toast({ title: 'Analysis complete' });
    } catch (e: any) {
      console.error('Analyze error', e);
      setError('Failed to analyze image');
      toast({ title: 'Analysis failed', description: 'Please try another photo.', variant: 'destructive' });
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setImageUrl(null);
    setResult(null);
    setError(null);
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-4 pt-6">
        {!imageUrl && !result && (
          <div className="space-y-3">
            <SimpleImageUpload onImageUpload={handleUpload} />
            <p className="text-sm text-muted-foreground">Images are analyzed securely via our edge function.</p>
          </div>
        )}

        {imageUrl && (
          <div className="space-y-3">
            <div className="aspect-video w-full overflow-hidden rounded-md border bg-muted">
              {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
              <img src={imageUrl} alt="Uploaded food photo for analysis" className="w-full h-full object-cover" loading="lazy" />
            </div>

            {analyzing && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing…
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            {result && (
              <div className="space-y-2">
                <h4 className="text-base font-medium">{result.name || 'Unknown item'}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Calories</div>
                    <div>{result.calories_per_100g != null ? `${Math.round(result.calories_per_100g)} kcal/100g` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Carbs</div>
                    <div>{result.carbs_per_100g != null ? `${result.carbs_per_100g} g/100g` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Protein</div>
                    <div>{result.protein_per_100g != null ? `${result.protein_per_100g} g/100g` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Fat</div>
                    <div>{result.fat_per_100g != null ? `${result.fat_per_100g} g/100g` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Serving</div>
                    <div>{result.estimated_serving_size != null ? `${result.estimated_serving_size} g` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Confidence</div>
                    <div>{result.confidence != null ? `${Math.round(result.confidence * 100)}%` : '—'}</div>
                  </div>
                </div>
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground">Show raw result</summary>
                  <pre className="mt-2 p-2 rounded bg-muted overflow-auto text-xs">{JSON.stringify(result, null, 2)}</pre>
                </details>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => (imageUrl ? analyze(imageUrl) : null)} disabled={analyzing}>
                <ImageIcon className="w-4 h-4 mr-2" /> Re-analyze
              </Button>
              <Button variant="secondary" onClick={reset}>
                <RefreshCcw className="w-4 h-4 mr-2" /> Try another image
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
