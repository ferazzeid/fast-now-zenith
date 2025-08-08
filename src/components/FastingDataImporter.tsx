import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CSVData {
  Hour: string;
  Stage: string;
  'Metabolic/Hormonal Changes': string;
  'Physiological Effects': string;
  'Mental & Emotional State': string;
  'Benefits & Challenges': string;
  Snippet: string;
}

export function FastingDataImporter() {
  const [csvData, setCsvData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: number } | null>(null);
  const { toast } = useToast();

  const parseCsvData = (csvText: string): CSVData[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split('\t').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split('\t').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row as CSVData;
    });
  };

  const importFastingData = async () => {
    if (!csvData.trim()) {
      toast({
        title: "No data provided",
        description: "Please paste your CSV data first.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      const parsedData = parseCsvData(csvData);
      let successCount = 0;
      let errorCount = 0;

      for (const row of parsedData) {
        try {
          const hour = parseInt(row.Hour);
          if (isNaN(hour)) continue;

          // Build content rotation variants
          const variants = [];
          if (row['Metabolic/Hormonal Changes']) {
            variants.push({ type: 'metabolic', content: row['Metabolic/Hormonal Changes'] });
          }
          if (row['Physiological Effects']) {
            variants.push({ type: 'physiological', content: row['Physiological Effects'] });
          }
          if (row['Mental & Emotional State']) {
            variants.push({ type: 'mental', content: row['Mental & Emotional State'] });
          }
          if (row['Benefits & Challenges']) {
            variants.push({ type: 'benefits', content: row['Benefits & Challenges'] });
          }
          if (row.Snippet) {
            variants.push({ type: 'snippet', content: row.Snippet });
          }

          // Update or insert fasting hour data
          const { error } = await supabase
            .from('fasting_hours')
            .upsert({
              hour,
              day: Math.ceil(hour / 24),
              stage: row.Stage,
              metabolic_changes: row['Metabolic/Hormonal Changes'],
              physiological_effects: row['Physiological Effects'],
              mental_emotional_state: row['Mental & Emotional State'] 
                ? row['Mental & Emotional State'].split(',').map(s => s.trim())
                : [],
              benefits_challenges: row['Benefits & Challenges'],
              content_snippet: row.Snippet,
              content_rotation_data: {
                current_index: 0,
                variants
              },
              title: `Hour ${hour}${row.Stage ? ` - ${row.Stage}` : ''}`,
              body_state: row['Physiological Effects'] || `Hour ${hour} of fasting`,
              phase: row.Stage || 'fasting',
              difficulty: hour <= 16 ? 'easy' : hour <= 48 ? 'medium' : 'hard'
            }, {
              onConflict: 'hour',
              ignoreDuplicates: false
            });

          if (error) {
            console.error(`Error importing hour ${hour}:`, error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error('Error processing row:', row, err);
          errorCount++;
        }
      }

      setImportResults({ success: successCount, errors: errorCount });
      
      if (successCount > 0) {
        toast({
          title: "Import completed",
          description: `Successfully imported ${successCount} hours${errorCount > 0 ? ` with ${errorCount} errors` : ''}.`
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "Failed to import CSV data. Please check the format.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Import Fasting Hours Data
        </CardTitle>
        <CardDescription>
          Import comprehensive fasting timeline data from CSV format. 
          Expected columns: Hour, Stage, Metabolic/Hormonal Changes, Physiological Effects, Mental & Emotional State, Benefits & Challenges, Snippet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            CSV Data (Tab-separated values)
          </label>
          <Textarea
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder="Paste your CSV data here..."
            className="min-h-[200px] font-mono text-xs"
          />
        </div>

        {importResults && (
          <div className="p-3 rounded-md bg-muted">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Import Results:</span>
            </div>
            <div className="mt-1 text-sm">
              <div className="text-green-600">✓ {importResults.success} records imported successfully</div>
              {importResults.errors > 0 && (
                <div className="text-red-600">✗ {importResults.errors} errors encountered</div>
              )}
            </div>
          </div>
        )}

        <Button 
          onClick={importFastingData}
          disabled={isImporting || !csvData.trim()}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {isImporting ? 'Importing...' : 'Import Data'}
        </Button>
      </CardContent>
    </Card>
  );
}