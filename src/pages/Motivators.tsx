import { useState } from 'react';
import { Plus, Camera, Edit3, Trash2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { EditMotivatorModal } from '@/components/EditMotivatorModal';

interface Motivator {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  createdAt: Date;
}

const Motivators = () => {
  const [motivators, setMotivators] = useState<Motivator[]>([
    {
      id: '1',
      title: 'Health First',
      description: 'Remember why you started - for your health and wellbeing',
      imageUrl: '/placeholder-health.jpg',
      createdAt: new Date()
    },
    {
      id: '2', 
      title: 'Mind Over Matter',
      description: 'You are stronger than your cravings',
      createdAt: new Date()
    }
  ]);
  const [editingMotivator, setEditingMotivator] = useState<Motivator | null>(null);
  const { toast } = useToast();

  const handleAddMotivator = () => {
    // This will be enhanced with camera and AI features
    const newMotivator: Motivator = {
      id: Date.now().toString(),
      title: 'New Motivation',
      description: 'Add your custom description here',
      createdAt: new Date()
    };
    
    setMotivators(prev => [newMotivator, ...prev]);
    toast({
      title: "✨ Motivator Added!",
      description: "Your new motivation is ready to inspire you.",
    });
  };

  const handleDeleteMotivator = (id: string) => {
    setMotivators(prev => prev.filter(m => m.id !== id));
    toast({
      title: "🗑️ Motivator Removed",
      description: "Motivator has been deleted.",
    });
  };

  const handleEditMotivator = (motivator: Motivator) => {
    setEditingMotivator(motivator);
  };

  const handleSaveMotivator = (updatedMotivator: Motivator) => {
    setMotivators(prev => 
      prev.map(m => m.id === updatedMotivator.id ? updatedMotivator : m)
    );
    setEditingMotivator(null);
    toast({
      title: "✨ Motivator Updated!",
      description: "Your motivator has been saved successfully.",
    });
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
          <Plus className="w-5 h-5 mr-2" />
          Create New Motivator
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

        {motivators.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 bg-ceramic-rim rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-warm-text">No Motivators Yet</h3>
              <p className="text-muted-foreground text-sm">
                Create your first motivator to get inspired during your fasts
              </p>
            </div>
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
      </div>
    </div>
  );
};

export default Motivators;