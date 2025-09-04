import { useState, useEffect } from 'react';
import { Check, Download, Sparkles, Heart, Target, Calendar, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMotivators } from '@/hooks/useMotivators';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PredefinedMotivator {
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
}

interface CustomMotivatorsImportProps {
  onComplete: () => void;
}

export const CustomMotivatorsImport: React.FC<CustomMotivatorsImportProps> = ({ onComplete }) => {
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [motivators, setMotivators] = useState<PredefinedMotivator[]>([]);
  const [loading, setLoading] = useState(true);
  const { createMotivator } = useMotivators();
  const { toast } = useToast();

  const loadPredefinedMotivators = async () => {
    try {
      const { data, error } = await supabase
        .from('system_motivators')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Transform system_motivators to match the PredefinedMotivator interface
      const motivatorsList = (data || []).map((m: any) => ({
        title: m.title,
        content: m.content,
        category: m.category || 'personal',
        imageUrl: m.male_image_url || m.female_image_url
      }));
      setMotivators(motivatorsList);
    } catch (error) {
      console.error('Error loading system motivators:', error);
      // Fallback to empty array if no system motivators found
      setMotivators([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredefinedMotivators();
  }, []);

  const handleImportAll = async () => {
    setImporting(true);
    
    try {
      let successCount = 0;
      
      for (const motivator of motivators) {
        const motivatorId = await createMotivator({
          title: motivator.title,
          content: motivator.content,
          category: motivator.category,
          imageUrl: motivator.imageUrl,
        });
        
        if (motivatorId) {
          successCount++;
        }
      }
      
      if (successCount === motivators.length) {
        toast({
          title: "🎉 Success!",
          description: `Imported ${successCount} motivators to your collection.`,
        });
        setImported(true);
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        toast({
          title: "Partially imported",
          description: `Imported ${successCount} of ${motivators.length} motivators.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: "There was an error importing the motivators. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-ceramic-plate rounded-3xl p-8 border border-ceramic-rim shadow-lg text-center">
        <p className="text-warm-text">Loading motivators...</p>
      </div>
    );
  }

  // If already imported, show success state
  if (imported) {
    return (
      <div className="bg-ceramic-plate rounded-3xl p-8 border border-ceramic-rim shadow-lg text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-primary/20 rounded-full p-4">
            <Check className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-warm-text mb-2">All Set!</h3>
        <p className="text-warm-text/70 mb-6">
          Your motivational collection has been imported successfully.
        </p>
      </div>
    );
  }

  // If no motivators available, show empty state
  if (motivators.length === 0) {
    return (
      <div className="bg-ceramic-plate rounded-3xl p-8 border border-ceramic-rim shadow-lg text-center">
        <h3 className="text-xl font-bold text-warm-text mb-2">No Predefined Motivators</h3>
        <p className="text-warm-text/70 mb-6">
          No predefined motivators are currently available. Contact your admin to add some.
        </p>
        <Button
          variant="outline"
          onClick={onComplete}
          className="bg-ceramic-base border-ceramic-rim"
        >
          Continue
        </Button>
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'health': return <Heart className="w-4 h-4" />;
      case 'personal': return <Target className="w-4 h-4" />;
      case 'confidence': return <Sparkles className="w-4 h-4" />;
      case 'achievement': return <Trophy className="w-4 h-4" />;
      case 'deadline': return <Calendar className="w-4 h-4" />;
      case 'lifestyle': return <Zap className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-ceramic-plate rounded-3xl p-8 border border-ceramic-rim shadow-lg">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-warm-text mb-2">Import Custom Motivators</h3>
        <p className="text-warm-text/70">
          Get started with {motivators.length} professionally crafted motivators designed to trigger real transformation
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-3 mb-6">
        {motivators.map((motivator, index) => {
          const IconComponent = getCategoryIcon(motivator.category);
          return (
            <Card key={index} className="bg-ceramic-base border-ceramic-rim p-4">
              <CardContent className="p-0">
                <div className="flex items-start space-x-4">
                  {motivator.imageUrl && (
                    <img 
                      src={motivator.imageUrl} 
                      alt={motivator.title}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {IconComponent}
                      <h4 className="font-medium text-warm-text text-sm">{motivator.title}</h4>
                    </div>
                    <p className="text-xs text-warm-text/70 line-clamp-2 mb-2">
                      {motivator.content.slice(0, 100)}...
                    </p>
                    <span className="inline-block px-2 py-1 bg-primary/20 text-primary text-xs rounded-full capitalize">
                      {motivator.category}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col space-y-3">
        <Button
          onClick={handleImportAll}
          disabled={importing}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {importing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Importing {motivators.length} motivators...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Import All {motivators.length} Motivators
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={onComplete}
          className="bg-ceramic-base border-ceramic-rim"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
};