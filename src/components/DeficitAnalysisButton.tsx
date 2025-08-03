import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Brain, Loader2 } from 'lucide-react';
import { useDeficitAnalysis } from '@/hooks/useDeficitAnalysis';
import { Card } from '@/components/ui/card';

export const DeficitAnalysisButton = () => {
  const { analyzeDeficit, analysis, loading, clearAnalysis } = useDeficitAnalysis();

  const handleAnalyze = async () => {
    clearAnalysis();
    await analyzeDeficit();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="action-secondary" 
          size="action-secondary"
          className="flex items-center gap-2 w-full"
        >
          <Brain className="w-4 h-4" />
          AI Analysis
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Daily Progress Analysis
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!analysis && (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Get personalized insights on your daily progress including calorie deficit, 
                food choices, activity levels, and goal progression.
              </p>
              <Button 
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Analyze My Day
                  </>
                )}
              </Button>
            </Card>
          )}

          {analysis && (
            <Card className="p-4">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {analysis}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex gap-2">
                <Button 
                  onClick={handleAnalyze}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Refresh Analysis'
                  )}
                </Button>
                <Button 
                  onClick={clearAnalysis}
                  variant="ghost"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};