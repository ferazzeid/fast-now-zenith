import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MotivatorFormModal } from '@/components/MotivatorFormModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { SmartInlineLoading } from '@/components/SimpleLoadingComponents';

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMotivator, setEditingMotivator] = useState<PredefinedMotivator | null>(null);
  const { toast } = useToast();
  const { data: motivators, isLoading, execute, setData } = useStandardizedLoading<PredefinedMotivator[]>([]);

  const loadMotivators = async () => {
    execute(async () => {
      const { data, error } = await supabase
        .from('system_motivators')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Transform system_motivators to match the PredefinedMotivator interface
      return (data || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        content: m.content,
        category: m.category || 'personal',
        imageUrl: m.male_image_url || m.female_image_url
      }));
    }, {
      onError: (error) => {
        console.error('Error loading system motivators:', error);
        toast({
          title: "Error loading motivators",
          description: "Could not load system motivators.",
          variant: "destructive",
        });
      }
    });
  };

  const saveMotivators = async (updatedMotivators: PredefinedMotivator[]) => {
    try {
      // Update each motivator in the system_motivators table
      for (const motivator of updatedMotivators) {
        if (motivator.id && !motivator.id.startsWith('temp_')) {
          // Update existing motivator
          const { error } = await supabase
            .from('system_motivators')
            .update({
              title: motivator.title,
              content: motivator.content,
              category: motivator.category,
              male_image_url: motivator.imageUrl,
              female_image_url: motivator.imageUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', motivator.id);

          if (error) throw error;
        } else {
          // Create new motivator
          const { error } = await supabase
            .from('system_motivators')
            .insert({
              title: motivator.title,
              content: motivator.content,
              category: motivator.category || 'personal',
              male_image_url: motivator.imageUrl,
              female_image_url: motivator.imageUrl,
              is_active: true,
              display_order: 0,
              slug: motivator.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
            });

          if (error) throw error;
        }
      }

      // Reload to get updated data
      loadMotivators();
      
      toast({
        title: "✅ Motivators Updated",
        description: "System motivators have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving motivators:', error);
      toast({
        title: "Error saving motivators",
        description: "Could not save changes to system motivators.",
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

  const handleDeleteMotivator = async (motivatorId: string) => {
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('system_motivators')
        .update({ is_active: false })
        .eq('id', motivatorId);

      if (error) throw error;

      // Reload to get updated data
      loadMotivators();
      
      toast({
        title: "✅ Motivator Deleted",
        description: "System motivator has been deactivated.",
      });
    } catch (error) {
      console.error('Error deleting motivator:', error);
      toast({
        title: "Error deleting motivator",
        description: "Could not delete the motivator.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadMotivators();
  }, []);

  if (isLoading) {
    return <SmartInlineLoading text="Loading predefined motivators" />;
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