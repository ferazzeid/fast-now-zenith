import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
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
  };
  onDelete: () => void;
}

export const SimpleMotivatorCard = memo<SimpleMotivatorCardProps>(({ 
  motivator, 
  onDelete 
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
          
          {/* Delete Action - only delete, no edit or add to default */}
          <div className="flex-shrink-0">
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="p-2 h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
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