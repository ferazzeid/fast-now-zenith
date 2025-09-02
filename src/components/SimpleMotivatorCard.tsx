import React, { memo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SimpleMotivatorCardProps {
  motivator: {
    id: string;
    title: string;
    content?: string;
    category?: string;
    show_in_animations?: boolean;
  };
  onDelete: () => void;
  onToggleAnimation?: (id: string, showInAnimations: boolean) => Promise<void>;
}

export const SimpleMotivatorCard = memo<SimpleMotivatorCardProps>(({ 
  motivator, 
  onDelete,
  onToggleAnimation
}) => {
  const [localShowInAnimations, setLocalShowInAnimations] = useState(motivator.show_in_animations);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    setLocalShowInAnimations(motivator.show_in_animations);
  }, [motivator.show_in_animations]);
  return (
    <Card className="overflow-hidden relative bg-card border-border">
      <CardContent className="p-6">
        <blockquote className="relative mb-4">
           {motivator.content && (
             <p className="text-lg text-foreground leading-relaxed mb-3">
               "{motivator.content}"
             </p>
           )}
           {motivator.title && motivator.title !== motivator.content && (
             <cite className="text-sm text-muted-foreground not-italic">
               — {motivator.title}
             </cite>
           )}
        </blockquote>
        <div className="flex items-start justify-between">
          {/* Spacer for layout */}
          <div className="flex-1"></div>
          
          {/* Actions - animation toggle and delete */}
          <div className="flex-shrink-0 flex items-center space-x-1">
            {onToggleAnimation && (
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (isToggling) return; // Prevent double clicks
                        
                        try {
                          const newValue = !localShowInAnimations;
                          setIsToggling(true);
                          
                          console.log('🔄 Toggling animation for motivator:', {
                            id: motivator.id,
                            currentValue: localShowInAnimations,
                            newValue: newValue,
                            title: motivator.title?.substring(0, 30)
                          });
                          
                          // Optimistically update local state first
                          setLocalShowInAnimations(newValue);
                          
                          await onToggleAnimation(motivator.id, newValue);
                          console.log('✅ Toggle animation successful');
                        } catch (error) {
                          console.error('❌ Error toggling animation setting:', error);
                          // Revert optimistic update on error
                          setLocalShowInAnimations(!localShowInAnimations);
                        } finally {
                          setIsToggling(false);
                        }
                      }}
                      disabled={isToggling}
                      className="p-2 h-8 w-8 hover:bg-muted/50 text-white transition-all duration-200"
                    >
                      {localShowInAnimations ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{localShowInAnimations !== false ? 'Hide from timer animations' : 'Show in timer animations'}</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="p-2 h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete this quote</p>
                </TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Quote</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this saved quote? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SimpleMotivatorCard.displayName = 'SimpleMotivatorCard';