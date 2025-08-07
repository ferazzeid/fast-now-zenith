import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MotivatorFormModal } from '@/components/MotivatorFormModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PredefinedMotivator {
  id?: string;
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
}

// Interface for the existing motivator modals
interface MotivatorModalData {
  id?: string;
  title: string;
  content?: string;
  category?: string;
  imageUrl?: string;
}

export const AdminPredefinedMotivators = () => {
  const [motivators, setMotivators] = useState<PredefinedMotivator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMotivator, setEditingMotivator] = useState<PredefinedMotivator | null>(null);
  const { toast } = useToast();

  const loadMotivators = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'predefined_motivators')
        .single();

      if (error) throw error;

      const motivatorsList = JSON.parse(data.setting_value || '[]');
      // Add temporary IDs for editing
      const motivatorsWithIds = motivatorsList.map((m: PredefinedMotivator, index: number) => ({
        ...m,
        id: m.id || `temp_${index}`
      }));
      setMotivators(motivatorsWithIds);
    } catch (error) {
      console.error('Error loading predefined motivators:', error);
      toast({
        title: "Error loading motivators",
        description: "Could not load predefined motivators.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveMotivators = async (updatedMotivators: PredefinedMotivator[]) => {
    try {
      // Remove temporary IDs before saving
      const cleanMotivators = updatedMotivators.map(({ id, ...motivator }) => motivator);
      
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'predefined_motivators',
          setting_value: JSON.stringify(cleanMotivators)
        });

      if (error) throw error;

      setMotivators(updatedMotivators);
      
      toast({
        title: "✅ Motivators Updated",
        description: "Predefined motivators have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving motivators:', error);
      toast({
        title: "Error saving motivators",
        description: "Could not save changes to predefined motivators.",
        variant: "destructive",
      });
    }
  };

  const handleCreateMotivator = (motivatorData: MotivatorModalData) => {
    const newMotivator: PredefinedMotivator = {
      title: motivatorData.title,
      content: motivatorData.content || '',
      category: motivatorData.category || 'personal',
      imageUrl: motivatorData.imageUrl,
      id: `temp_${Date.now()}`
    };
    const updatedMotivators = [...motivators, newMotivator];
    saveMotivators(updatedMotivators);
    setShowCreateModal(false);
  };

  const handleEditMotivator = (updatedMotivator: MotivatorModalData) => {
    const updatedMotivators = motivators.map(m => 
      m.id === updatedMotivator.id ? {
        ...m,
        title: updatedMotivator.title,
        content: updatedMotivator.content || m.content,
        category: updatedMotivator.category || m.category,
        imageUrl: updatedMotivator.imageUrl
      } : m
    );
    saveMotivators(updatedMotivators);
    setEditingMotivator(null);
  };

  const handleDeleteMotivator = (motivatorId: string) => {
    const updatedMotivators = motivators.filter(m => m.id !== motivatorId);
    saveMotivators(updatedMotivators);
  };

  useEffect(() => {
    loadMotivators();
  }, []);

  if (loading) {
    return <div className="text-warm-text">Loading predefined motivators...</div>;
  }

  return (
    <Card className="bg-ceramic-plate border-ceramic-rim">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-warm-text">Predefined Motivators</CardTitle>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Motivator
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {motivators.map((motivator) => (
            <Card key={motivator.id} className="bg-ceramic-base border-ceramic-rim">
              <CardContent className="p-4">
                {motivator.imageUrl && (
                  <img 
                    src={motivator.imageUrl} 
                    alt={motivator.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h4 className="font-medium text-warm-text mb-2">{motivator.title}</h4>
                <p className="text-sm text-warm-text/70 mb-2 line-clamp-2">{motivator.content}</p>
                <p className="text-xs text-primary capitalize mb-3">{motivator.category}</p>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingMotivator(motivator)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteMotivator(motivator.id!)}
                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {motivators.length === 0 && (
          <p className="text-center text-warm-text/70 py-8">
            No predefined motivators yet. Add some to get started!
          </p>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <MotivatorFormModal
            onSave={handleCreateMotivator}
            onClose={() => setShowCreateModal(false)}
          />
        )}

        {/* Edit Modal */}
        {editingMotivator && (
          <MotivatorFormModal
            motivator={{
              id: editingMotivator.id || '',
              title: editingMotivator.title,
              content: editingMotivator.content,
              imageUrl: editingMotivator.imageUrl
            }}
            onSave={handleEditMotivator}
            onClose={() => setEditingMotivator(null)}
          />
        )}
      </CardContent>
    </Card>
  );
};