import { useState } from 'react';
import { Search, Lightbulb, Plus, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminGoalIdeas, AdminGoalIdea } from '@/hooks/useAdminGoalIdeas';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';

interface GoalIdeasLibraryProps {
  onSelectGoal: (goal: AdminGoalIdea) => void;
  onClose: () => void;
}

export const GoalIdeasLibrary = ({ onSelectGoal, onClose }: GoalIdeasLibraryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const { goalIdeas, loading } = useAdminGoalIdeas();

  const filteredGoals = goalIdeas.filter(goal =>
    goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-warm-text">Goal Ideas</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="w-10 h-10 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200">
          <X className="w-8 h-8" />
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search goal ideas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Goal Ideas List */}
      <div className="max-h-80 overflow-y-auto space-y-3">
        {filteredGoals.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No goal ideas found</p>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const isExpanded = expandedGoal === goal.id;
            
            return (
              <Card key={goal.id} className="border-ceramic-rim transition-colors">
                <div 
                  className="p-3 cursor-pointer hover:bg-ceramic-base"
                  onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                >
                  <div className="flex gap-3">
                    {/* Goal Image */}
                    <div className="w-12 h-12 flex-shrink-0">
                      <MotivatorImageWithFallback
                        src={goal.imageUrl}
                        alt={goal.title}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    
                    {/* Goal Content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-warm-text text-sm">{goal.title}</h4>
                        <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                          {goal.category}
                        </Badge>
                      </div>
                      <p className={`text-xs text-muted-foreground ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {goal.description}
                      </p>
                    </div>
                    
                    {/* Expand/Add Button */}
                    <div className="flex items-center gap-1">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Add Button - Only shown when expanded */}
                {isExpanded && (
                  <div className="px-3 pb-3">
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectGoal(goal);
                      }}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add This Goal
                    </Button>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};