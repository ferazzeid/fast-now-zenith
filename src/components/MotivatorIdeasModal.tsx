import { useState } from 'react';
import { UniversalModal } from '@/components/ui/universal-modal';
import { Lightbulb, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAdminGoalIdeas, AdminGoalIdea } from '@/hooks/useAdminGoalIdeas';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
                const shouldShowExpandButton = goal.description && goal.description.length > 50;
                
                return (
                  <Card key={goal.id} className="overflow-hidden relative">
                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Image */}
                        <div className="w-32 h-32 flex-shrink-0">
                          <MotivatorImageWithFallback
                            src={goal.imageUrl}
                            alt={goal.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                       
                        {/* Content */}
                        <div 
                          className="flex-1 p-4 pr-2 cursor-pointer hover:bg-muted/5"
                          onClick={(e) => {
                            if (shouldShowExpandButton) {
                              e.stopPropagation();
                              setExpandedGoal(isExpanded ? null : goal.id);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between h-full">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center">
                                <h3 className="font-semibold text-warm-text line-clamp-1">
                                  {goal.title}
                                </h3>
                              </div>
                              
                              {goal.description && (
                                <div className="text-sm text-muted-foreground">
                                  {isExpanded ? (
                                    <p className="whitespace-pre-wrap">{goal.description}</p>
                                  ) : (
                                    <p className="line-clamp-2">{goal.description}</p>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Add Button */}
                            <div className="flex flex-col gap-1 ml-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectGoal(goal);
                                      onClose();
                                    }}
                                    className="p-1 h-6 w-6 hover:bg-primary/10 hover:text-primary"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Add this motivator to your goals</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expand button at bottom-right */}
                      {shouldShowExpandButton && (
                        <div className="absolute bottom-2 right-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                                className="h-6 w-6 p-0 rounded-full hover:bg-muted/10"
                              >
                                <ChevronDown 
                                  className={`w-3 h-3 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`} 
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isExpanded ? 'Show less' : 'Show full description'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
    </UniversalModal>
  );
};