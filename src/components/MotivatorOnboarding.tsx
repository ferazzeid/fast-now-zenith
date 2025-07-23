import { useState } from 'react';
import { CheckCircle, Heart, Target, Users, Trophy, Camera, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MotivatorTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ElementType;
  examples: string[];
  imagePrompt: string;
}

interface MotivatorOnboardingProps {
  onComplete: (selectedTemplates: MotivatorTemplate[]) => void;
  onSkip: () => void;
}

const motivatorTemplates: MotivatorTemplate[] = [
  {
    id: 'health',
    title: 'Health Goals',
    description: 'Focus on feeling better, having more energy, and improving your overall wellness',
    category: 'health',
    icon: Heart,
    examples: [
      'Lower my blood pressure',
      'Reduce inflammation',
      'Boost my energy levels',
      'Improve my sleep quality'
    ],
    imagePrompt: 'A vibrant image showing health and vitality'
  },
  {
    id: 'appearance',
    title: 'Look & Feel Great',
    description: 'Achieve the body confidence and appearance goals that matter to you',
    category: 'appearance', 
    icon: Target,
    examples: [
      'Fit into my favorite clothes',
      'Feel confident in photos',
      'See definition in my face',
      'Love how I look in the mirror'
    ],
    imagePrompt: 'An inspiring before/after or goal image'
  },
  {
    id: 'personal',
    title: 'Personal Growth',
    description: 'Build discipline, mental strength, and achieve personal milestones',
    category: 'personal',
    icon: Sparkles,
    examples: [
      'Prove I can stick to commitments',
      'Build mental resilience', 
      'Develop self-discipline',
      'Feel proud of my willpower'
    ],
    imagePrompt: 'A motivational quote or personal symbol'
  },
  {
    id: 'relationship',
    title: 'For Someone Special',
    description: 'Be your best self for the people who matter most in your life',
    category: 'relationship',
    icon: Users,
    examples: [
      'Be healthy for my family',
      'Set a good example for my kids',
      'Feel confident with my partner',
      'Be there for loved ones longer'
    ],
    imagePrompt: 'A photo of your loved ones or special person'
  },
  {
    id: 'achievement',
    title: 'Achievement Goals',
    description: 'Reach specific milestones and celebrate meaningful accomplishments',
    category: 'achievement',
    icon: Trophy,
    examples: [
      'Complete my first 24-hour fast',
      'Reach my target weight',
      'Maintain consistency for 30 days',
      'Achieve my dream body composition'
    ],
    imagePrompt: 'A visual representation of your goal or achievement'
  }
];

export const MotivatorOnboarding = ({ onComplete, onSkip }: MotivatorOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState<'intro' | 'selection' | 'complete'>('intro');
  const [selectedTemplates, setSelectedTemplates] = useState<MotivatorTemplate[]>([]);

  const handleTemplateSelect = (template: MotivatorTemplate) => {
    setSelectedTemplates(prev => {
      const exists = prev.find(t => t.id === template.id);
      if (exists) {
        return prev.filter(t => t.id !== template.id);
      }
      return [...prev, template];
    });
  };

  const handleContinue = () => {
    if (currentStep === 'intro') {
      setCurrentStep('selection');
    } else if (currentStep === 'selection') {
      setCurrentStep('complete');
    }
  };

  const handleComplete = () => {
    onComplete(selectedTemplates);
  };

  if (currentStep === 'intro') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="bg-ceramic-plate p-8 max-w-lg w-full border-ceramic-rim">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-warm-text">Welcome to Motivators!</h2>
              <p className="text-muted-foreground leading-relaxed">
                Motivators are your personal reminders of <strong>why</strong> you're fasting. 
                They help you stay strong during challenging moments and celebrate your progress.
              </p>
            </div>

            <div className="bg-ceramic-base p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-warm-text">Why Motivators Work:</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Visual reminders strengthen willpower</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Personal connection increases motivation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Clear goals make success more likely</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onSkip} className="flex-1">
                Skip for now
              </Button>
              <Button onClick={handleContinue} className="flex-1 bg-primary">
                Let's create some!
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (currentStep === 'selection') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="bg-ceramic-plate p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-ceramic-rim">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-warm-text">Choose Your Motivator Types</h2>
              <p className="text-muted-foreground">
                Select the categories that resonate with your fasting goals. We'll help you create personalized motivators.
              </p>
            </div>

            <div className="grid gap-4">
              {motivatorTemplates.map((template) => {
                const Icon = template.icon;
                const isSelected = selectedTemplates.some(t => t.id === template.id);
                
                return (
                  <Card
                    key={template.id}
                    className={`p-4 cursor-pointer transition-all border-2 ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-ceramic-rim hover:border-primary/50'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-ceramic-rim'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-warm-text">{template.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-warm-text">Examples:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.examples.slice(0, 2).map((example, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {example}
                              </Badge>
                            ))}
                            {template.examples.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.examples.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onSkip} className="flex-1">
                Skip for now
              </Button>
              <Button 
                onClick={handleContinue} 
                disabled={selectedTemplates.length === 0}
                className="flex-1 bg-primary"
              >
                Continue ({selectedTemplates.length} selected)
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (currentStep === 'complete') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="bg-ceramic-plate p-8 max-w-lg w-full border-ceramic-rim">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-warm-text">Perfect!</h2>
              <p className="text-muted-foreground">
                You've selected <strong>{selectedTemplates.length}</strong> motivator categories. 
                Our AI will help you create powerful, personalized motivators for each one.
              </p>
            </div>

            <div className="bg-ceramic-base p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-warm-text">Pro Tip:</h3>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                Adding personal photos to your motivators makes them 10x more powerful. 
                Think about images that represent your goals - your loved ones, goal outfits, 
                or progress photos.
              </p>
            </div>

            <Button onClick={handleComplete} className="w-full bg-primary">
              Create My Motivators
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};