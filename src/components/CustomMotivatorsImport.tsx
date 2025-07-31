import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Sparkles, Check } from 'lucide-react';
import { useMotivators } from '@/hooks/useMotivators';
import { useToast } from '@/hooks/use-toast';

// Import all custom motivator images
import mirrorWakeUpImage from '@/assets/motivator-mirror-wake-up.jpg';
import fitOldClothesImage from '@/assets/motivator-fit-old-clothes.jpg';
import fitNewClothesImage from '@/assets/motivator-fit-new-clothes.jpg';
import beLookedAtImage from '@/assets/motivator-be-looked-at.jpg';
import impressThemAllImage from '@/assets/motivator-impress-them-all.jpg';
import regainSelfRespectImage from '@/assets/motivator-regain-self-respect.jpg';
import fixInsulinLevelsImage from '@/assets/motivator-fix-insulin-levels.jpg';
import fixUnexplainedSymptomsImage from '@/assets/motivator-fix-unexplained-symptoms.jpg';
import eventCountdownImage from '@/assets/motivator-event-countdown.jpg';
import autophagyCleanUpImage from '@/assets/motivator-autophagy-clean-up.jpg';

const CUSTOM_MOTIVATORS = [
  {
    title: "Mirror Wake-Up",
    content: "Seeing myself in the mirror or security camera and hating it. A harsh moment of clarity — when your reflection becomes a trigger. This is often the first jolt that forces real change.",
    category: "personal",
    imageUrl: mirrorWakeUpImage
  },
  {
    title: "Fit Into Old Clothes",
    content: "Fitting into old clothes again. Nothing proves progress more than slipping into something that once felt impossible. A simple, physical milestone that means everything.",
    category: "personal",
    imageUrl: fitOldClothesImage
  },
  {
    title: "Fit Into New Clothes",
    content: "Finally fitting into expensive new clothes I bought and never wore. This is the revenge arc — the clothes you once bought in hope, now finally fitting. Symbolic of reclaiming self-worth.",
    category: "personal",
    imageUrl: fitNewClothesImage
  },
  {
    title: "Be Looked At",
    content: "Wanting to be looked at again — to feel attractive and back on the market. After fading into the background, this goal is about becoming visible again — wanting to turn heads, feel attractive, reawaken desire.",
    category: "personal",
    imageUrl: beLookedAtImage
  },
  {
    title: "Impress Them All",
    content: "Wanting to impress or surprise someone (romantic or not). This is about transformation being seen. To make someone's jaw drop — not for revenge, but satisfaction.",
    category: "personal",
    imageUrl: impressThemAllImage
  },
  {
    title: "Regain Self-Respect",
    content: "Getting confidence back — regaining self-respect through visible change. When you start showing up for yourself, your posture changes. This is about restoring dignity through action and discipline.",
    category: "personal",
    imageUrl: regainSelfRespectImage
  },
  {
    title: "Fix Insulin Levels",
    content: "Worrying about insulin levels or other early warning signs. A health scare — even minor — can flip the switch. This motivator is about prevention before crisis hits.",
    category: "health",
    imageUrl: fixInsulinLevelsImage
  },
  {
    title: "Fix Unexplained Symptoms",
    content: "Struggling with weird, unexplained physical symptoms — and hoping weight loss will fix them. Strange symptoms without answers — bloating, aches, fatigue. When nothing works, the hope is that lifestyle change might.",
    category: "health",
    imageUrl: fixUnexplainedSymptomsImage
  },
  {
    title: "Event Countdown",
    content: "Getting ready for an upcoming event (wedding, reunion, etc.). A set date creates urgency. You picture yourself walking in transformed — and that image fuels every choice.",
    category: "goals",
    imageUrl: eventCountdownImage
  },
  {
    title: "Autophagy Clean-Up",
    content: "Autophagy: triggering deep cellular cleanup through extended fasting. For those who fast, this motivator goes deeper — it's about longevity, healing, and total reset from the inside out.",
    category: "health",
    imageUrl: autophagyCleanUpImage
  }
];

interface CustomMotivatorsImportProps {
  onComplete: () => void;
}

export const CustomMotivatorsImport: React.FC<CustomMotivatorsImportProps> = ({ onComplete }) => {
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const { createMotivator } = useMotivators();
  const { toast } = useToast();

  const handleImportAll = async () => {
    setImporting(true);
    
    try {
      let successCount = 0;
      
      for (const motivator of CUSTOM_MOTIVATORS) {
        const result = await createMotivator(motivator);
        if (result) {
          successCount++;
        }
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      setImported(true);
      toast({
        title: "✨ Custom Motivators Imported!",
        description: `Successfully imported ${successCount} custom motivators.`,
      });
      
      // Auto close after 2 seconds
      setTimeout(() => {
        onComplete();
      }, 2000);
      
    } catch (error) {
      console.error('Error importing motivators:', error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "Unable to import custom motivators. Please try again."
      });
    } finally {
      setImporting(false);
    }
  };

  if (imported) {
    return (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Import Complete!</h3>
            <p className="text-sm text-muted-foreground">
              All {CUSTOM_MOTIVATORS.length} custom motivators have been added to your collection.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Custom Motivator Collection</h2>
        <p className="text-muted-foreground">
          Import professionally designed motivators based on real transformation triggers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
        {CUSTOM_MOTIVATORS.map((motivator, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-start space-x-3">
              <img 
                src={motivator.imageUrl} 
                alt={motivator.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm mb-1">
                  {motivator.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {motivator.content.split('.')[0]}.
                </p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {motivator.category}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col items-center space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            <strong>{CUSTOM_MOTIVATORS.length} motivators</strong> covering personal goals, health triggers, and transformation milestones
          </p>
        </div>
        
        <Button 
          onClick={handleImportAll}
          disabled={importing}
          className="w-full max-w-sm"
          size="lg"
        >
          {importing ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Import All Custom Motivators
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onComplete}
          className="text-sm"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
};