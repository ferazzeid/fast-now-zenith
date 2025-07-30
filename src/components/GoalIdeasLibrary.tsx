import { useState } from 'react';
import { Search, Lightbulb, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminGoalIdeas, AdminGoalIdea } from '@/hooks/useAdminGoalIdeas';

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
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading goal ideas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-warm-text">Goal Ideas</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
          ✕
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
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      {goal.imageUrl ? (
                        <img 
                          src={goal.imageUrl} 
                          alt={goal.title}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Lightbulb className="w-6 h-6 text-muted-foreground" />
                      )}
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