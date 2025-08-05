import { useState } from 'react';
import { UniversalModal } from '@/components/ui/universal-modal';
import { Lightbulb, Plus, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminGoalIdeas, AdminGoalIdea } from '@/hooks/useAdminGoalIdeas';

interface MotivatorIdeasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGoal: (goal: AdminGoalIdea) => void;
}

export const MotivatorIdeasModal = ({ isOpen, onClose, onSelectGoal }: MotivatorIdeasModalProps) => {
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const { goalIdeas, loading } = useAdminGoalIdeas();

  if (loading) {
    return (
      <UniversalModal
        isOpen={isOpen}
        onClose={onClose}
        title="Motivator Ideas"
        variant="standard"
        size="lg"
        showCloseButton={true}
      >
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-4 h-4 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded w-32" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-3 border border-ceramic-rim rounded-lg">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-full" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                    <div className="h-5 bg-muted animate-pulse rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
      </UniversalModal>
    );
  }

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Motivator Ideas"
      variant="standard"
      size="lg"
      showCloseButton={true}
    >
        
        <div className="space-y-4">
          {/* Goal Ideas List */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {goalIdeas.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No motivator ideas found</p>
              </div>
            ) : (
              goalIdeas.map((goal) => {
                const isExpanded = expandedGoal === goal.id;
                
                return (
                  <Card key={goal.id} className="border-ceramic-rim transition-colors">
                    <div 
                      className="p-3 cursor-pointer hover:bg-ceramic-base"
                      onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                    >
                      <div className="flex gap-3">
                        {/* Goal Image */}
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                          {goal.imageUrl ? (
                            <img 
                              src={goal.imageUrl} 
                              alt={goal.title}
                              className="w-full h-full object-cover rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement?.classList.add('bg-muted');
                              }}
                            />
                          ) : (
                            <Lightbulb className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        
                        {/* Goal Content */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-warm-text text-sm">{goal.title}</h4>
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectGoal(goal);
                                onClose();
                              }}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground h-6 w-6 p-1"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className={`text-xs text-muted-foreground ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {goal.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom expand indicator */}
                    <div 
                      className="flex justify-center py-2 bg-muted/30 hover:bg-muted/50 cursor-pointer border-t border-muted/50"
                      onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                    >
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
    </UniversalModal>
  );
};