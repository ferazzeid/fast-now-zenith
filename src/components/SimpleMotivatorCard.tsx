import React, { memo } from 'react';
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
  return (
    <Card className="overflow-hidden relative bg-gray-900 border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          {/* Content - only description in larger font */}
          <div className="flex-1 pr-4">
            {motivator.content && (
              <p className="text-lg text-white leading-relaxed whitespace-pre-wrap">
                {motivator.content}
              </p>
            )}
          </div>
          
          {/* Actions - animation toggle and delete */}
          <div className="flex-shrink-0 flex items-center space-x-1">
            {onToggleAnimation && (
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          const newValue = !motivator.show_in_animations;
                          console.log('🔄 Toggling animation for motivator:', {
                            id: motivator.id,
                            currentValue: motivator.show_in_animations,
                            newValue: newValue,
                            title: motivator.title?.substring(0, 30)
                          });
                          await onToggleAnimation(motivator.id, newValue);
                          console.log('✅ Toggle animation successful');
                        } catch (error) {
                          console.error('❌ Error toggling animation setting:', error);
                        }
                      }}
                      className="p-2 h-8 w-8 hover:bg-muted/50 text-white relative"
                    >
                    <Eye className={`w-4 h-4 ${motivator.show_in_animations === false ? 'line-through' : ''}`} />
                    {motivator.show_in_animations === false && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-px bg-white rotate-45" />
                      </div>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{motivator.show_in_animations !== false ? 'Hide from timer animations' : 'Show in timer animations'}</p>
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