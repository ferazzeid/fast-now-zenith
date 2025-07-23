import { useState, useEffect } from 'react';
import { Plus, Camera, Edit3, Trash2, Heart, Sparkles, Target, Users, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { EditMotivatorModal } from '@/components/EditMotivatorModal';
import { MotivatorOnboarding } from '@/components/MotivatorOnboarding';
import { MotivatorCreationWizard } from '@/components/MotivatorCreationWizard';
import { useMotivators, type Motivator as DbMotivator } from '@/hooks/useMotivators';
import { useAuth } from '@/hooks/useAuth';

interface Motivator {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  createdAt: Date;
}

interface MotivatorTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ElementType;
  examples: string[];
  imagePrompt: string;
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

const Motivators = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<MotivatorTemplate[]>([]);
  const [editingMotivator, setEditingMotivator] = useState<Motivator | null>(null);
  const { motivators: dbMotivators, loading, createMotivator, updateMotivator, deleteMotivator } = useMotivators();
  const { user } = useAuth();
  const { toast } = useToast();

  // Convert database motivators to display format
  const motivators: Motivator[] = dbMotivators.map(m => ({
    id: m.id,
    title: m.title,
    description: m.content || undefined,
    imageUrl: undefined, // TODO: Add image URL handling
    createdAt: new Date(m.created_at)
  }));

  // Check if user needs onboarding (no motivators and not shown before)
  useEffect(() => {
    if (!loading && motivators.length === 0 && user) {
      const hasSeenOnboarding = localStorage.getItem(`motivator-onboarding-${user.id}`);
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [motivators.length, loading, user]);

  const handleAddMotivator = () => {
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = (templates: MotivatorTemplate[]) => {
    if (user) {
      localStorage.setItem(`motivator-onboarding-${user.id}`, 'true');
    }
    setSelectedTemplates(templates);
    setShowOnboarding(false);
    setShowWizard(true);
  };

  const handleOnboardingSkip = () => {
    if (user) {
      localStorage.setItem(`motivator-onboarding-${user.id}`, 'true');
    }
    setShowOnboarding(false);
  };

  const handleWizardComplete = async (newMotivators: Array<{title: string; content: string; category: string; imageUrl?: string}>) => {
    for (const motivator of newMotivators) {
      await createMotivator({
        title: motivator.title,
        content: motivator.content,
        category: motivator.category
      });
    }
    setShowWizard(false);
    setSelectedTemplates([]);
  };

  const handleWizardCancel = () => {
    setShowWizard(false);
    setSelectedTemplates([]);
  };

  const handleDeleteMotivator = async (id: string) => {
    await deleteMotivator(id);
  };

  const handleEditMotivator = (motivator: Motivator) => {
    setEditingMotivator(motivator);
  };

  const handleSaveMotivator = async (updatedMotivator: Motivator) => {
    await updateMotivator(updatedMotivator.id, {
      title: updatedMotivator.title,
      content: updatedMotivator.description || '',
      category: 'personal' // Default category for manual edits
    });
    setEditingMotivator(null);
  };

  return (
    <div className="min-h-screen bg-ceramic-base px-4 pt-8 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-warm-text">Motivators</h1>
          <p className="text-muted-foreground">Fuel your fasting journey</p>
        </div>

        {/* Add New Button */}
        <Button
          onClick={handleAddMotivator}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          {motivators.length === 0 ? 'Create Your First Motivators' : 'Add New Motivator'}
        </Button>

        {/* AI Features Notice */}
        <Card className="p-4 bg-accent/50 border-accent">
          <div className="flex items-start space-x-3">
            <Camera className="w-5 h-5 text-accent-foreground mt-1 flex-shrink-0" />
            <div className="space-y-1">
              <h3 className="font-medium text-accent-foreground">AI Features Available</h3>
              <p className="text-sm text-muted-foreground">
                Add your OpenAI API key in Settings to unlock camera capture and voice-to-text features for creating motivators.
              </p>
            </div>
          </div>
        </Card>

        {/* Motivators Grid */}
        <div className="space-y-4">
          {motivators.map((motivator) => (
            <Card 
              key={motivator.id} 
              className="bg-ceramic-plate border-ceramic-rim overflow-hidden"
            >
              {motivator.imageUrl && (
                <div className="aspect-video bg-ceramic-rim relative overflow-hidden">
                  <img 
                    src={motivator.imageUrl} 
                    alt={motivator.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              )}
              
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-warm-text text-lg">
                      {motivator.title}
                    </h3>
                    {motivator.description && (
                      <p className="text-muted-foreground text-sm mt-1">
                        {motivator.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditMotivator(motivator)}
                      className="hover:bg-ceramic-rim"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMotivator(motivator.id)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Created {motivator.createdAt.toLocaleDateString()}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {motivators.length === 0 && !loading && (
          <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 bg-ceramic-rim rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-warm-text">No Motivators Yet</h3>
              <p className="text-muted-foreground text-sm">
                Create your first motivators with our AI-powered setup wizard
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground text-sm mt-2">Loading your motivators...</p>
          </div>
        )}

        {/* Edit Modal */}
        {editingMotivator && (
          <EditMotivatorModal
            motivator={editingMotivator}
            onSave={handleSaveMotivator}
            onClose={() => setEditingMotivator(null)}
          />
        )}

        {/* Onboarding */}
        {showOnboarding && (
          <MotivatorOnboarding
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        )}

        {/* Creation Wizard */}
        {showWizard && (
          <MotivatorCreationWizard
            templates={selectedTemplates}
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        )}
      </div>
    </div>
  );
};

export default Motivators;