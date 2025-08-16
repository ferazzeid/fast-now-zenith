import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Search, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CleanupResult {
  bucketName: string;
  totalFiles: number;
  referencedFiles: number;
  orphanedFiles: number;
  deletedFiles: number;
  spaceFreed: string;
  errors: string[];
}

interface CleanupResponse {
  success: boolean;
  summary: {
    mode: string;
    bucketsProcessed: number;
    totalOrphanedFiles: number;
    totalDeletedFiles: number;
    totalErrors: number;
    referencedImagesInDatabase: number;
  };
  results: CleanupResult[];
  timestamp: string;
}

export const StorageCleanupPanel = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [lastResult, setLastResult] = useState<CleanupResponse | null>(null);
  const { toast } = useToast();

  const runCleanup = async (dryRun: boolean) => {
    const isAnalysis = dryRun;
    if (isAnalysis) {
      setIsAnalyzing(true);
    } else {
      setIsCleaning(true);
    }

    try {
      console.log(`🚀 Starting storage ${isAnalysis ? 'analysis' : 'cleanup'}...`);
      
      const { data, error } = await supabase.functions.invoke('storage-cleanup', {
        body: {
          buckets: ['motivator-images', 'website-images', 'food-images', 'background-images', 'blog-images'],
          dryRun
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setLastResult(data);
      
      if (isAnalysis) {
        toast({
          title: "Storage Analysis Complete",
          description: `Found ${data.summary.totalOrphanedFiles} orphaned files across ${data.summary.bucketsProcessed} buckets`,
        });
      } else {
        toast({
          title: "Storage Cleanup Complete",
          description: `Successfully deleted ${data.summary.totalDeletedFiles} orphaned files`,
        });
      }

    } catch (error: any) {
      console.error(`❌ Storage ${isAnalysis ? 'analysis' : 'cleanup'} failed:`, error);
      toast({
        title: `Storage ${isAnalysis ? 'Analysis' : 'Cleanup'} Failed`,
        description: error.message || `Failed to ${isAnalysis ? 'analyze' : 'clean'} storage`,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setIsCleaning(false);
    }
  };

  const formatSize = (sizeStr: string) => {
    const size = parseFloat(sizeStr);
    if (size >= 1024) {
      return `${(size / 1024).toFixed(1)} GB`;
    }
    return `${size} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Storage Cleanup - Phase 2: Recovery
        </CardTitle>
        <CardDescription>
          Identify and remove orphaned storage files that are no longer referenced in the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => runCleanup(true)}
            disabled={isAnalyzing || isCleaning}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Analyze Storage'}
          </Button>
          
          {lastResult && lastResult.summary.totalOrphanedFiles > 0 && (
            <Button
              onClick={() => runCleanup(false)}
              disabled={isAnalyzing || isCleaning}
              variant="destructive"
              className="flex items-center gap-2"
            >
              {isCleaning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {isCleaning ? 'Cleaning...' : `Delete ${lastResult.summary.totalOrphanedFiles} Orphaned Files`}
            </Button>
          )}
        </div>

        {/* Warning Alert */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Analysis is safe</strong> - it only identifies orphaned files without deleting anything. 
            <strong>Cleanup permanently deletes files</strong> - make sure to run analysis first to review what will be deleted.
          </AlertDescription>
        </Alert>

        {/* Results Display */}
        {lastResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-background border rounded-lg p-3">
                <div className="text-2xl font-bold text-primary">
                  {lastResult.summary.referencedImagesInDatabase}
                </div>
                <div className="text-sm text-muted-foreground">Referenced Images</div>
              </div>
              
              <div className="bg-background border rounded-lg p-3">
                <div className="text-2xl font-bold text-destructive">
                  {lastResult.summary.totalOrphanedFiles}
                </div>
                <div className="text-sm text-muted-foreground">Orphaned Files</div>
              </div>
              
              <div className="bg-background border rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">
                  {lastResult.summary.totalDeletedFiles}
                </div>
                <div className="text-sm text-muted-foreground">Deleted Files</div>
              </div>
              
              <div className="bg-background border rounded-lg p-3">
                <div className="text-2xl font-bold text-amber-600">
                  {lastResult.summary.totalErrors}
                </div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>

            {/* Per-bucket Results */}
            <div className="space-y-3">
              <h4 className="font-medium">Per-Bucket Results:</h4>
              {lastResult.results.map((result) => (
                <div key={result.bucketName} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{result.bucketName}</h5>
                    <div className="flex items-center gap-2">
                      {result.errors.length === 0 ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {formatSize(result.spaceFreed)} to be freed
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total: </span>
                      <span className="font-medium">{result.totalFiles}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Referenced: </span>
                      <span className="font-medium text-green-600">{result.referencedFiles}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Orphaned: </span>
                      <span className="font-medium text-destructive">{result.orphanedFiles}</span>
                    </div>
                  </div>

                  {result.errors.length > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="text-destructive">Errors:</span>
                      <ul className="list-disc list-inside ml-2">
                        {result.errors.map((error, idx) => (
                          <li key={idx} className="text-muted-foreground">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-xs text-muted-foreground">
              Last run: {new Date(lastResult.timestamp).toLocaleString()} 
              {lastResult.summary.mode === 'dry_run' ? ' (Analysis Mode)' : ' (Live Cleanup)'}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!lastResult && (
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Step 1:</strong> Click "Analyze Storage" to identify orphaned files (safe operation)</p>
            <p><strong>Step 2:</strong> Review the results to see what files will be deleted</p>
            <p><strong>Step 3:</strong> Click "Delete Orphaned Files" to perform the actual cleanup</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};