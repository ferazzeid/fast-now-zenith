import React, { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Image, Edit, Trash2 } from 'lucide-react';
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

interface ExpandableMotivatorCardProps {
  motivator: {
    id: string;
    title: string;
    content?: string;
    imageUrl?: string;
    category?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export const ExpandableMotivatorCard = memo<ExpandableMotivatorCardProps>(({ 
  motivator, 
  onEdit, 
  onDelete 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShowExpandButton = motivator.content && motivator.content.length > 50;

  return (
    <Card className="overflow-hidden relative">
      <CardContent className="p-0">
        <div className="flex">
          {/* Image */}
          <div className="w-32 h-32 bg-muted flex items-center justify-center flex-shrink-0">
            {motivator.imageUrl ? (
              <img 
                src={motivator.imageUrl} 
                alt={motivator.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1581090464777-f3220bbe18b8?w=400&h=400&fit=crop';
                }}
              />
            ) : (
              <Image className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
         
          {/* Content */}
          <div 
            className="flex-1 p-4 pr-2 cursor-pointer hover:bg-muted/5"
            onClick={(e) => {
              if (shouldShowExpandButton) {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }
            }}
          >
            <div className="flex items-start justify-between h-full">
              <div className="flex-1 space-y-1">
                <div className="flex items-center">
                  <h3 className="font-semibold text-warm-text line-clamp-1">
                    {motivator.title}
                  </h3>
                </div>
                
                {motivator.content && (
                  <div className="text-sm text-muted-foreground">
                    {isExpanded ? (
                      <p className="whitespace-pre-wrap">{motivator.content}</p>
                    ) : (
                      <p className="line-clamp-2">{motivator.content}</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex flex-col gap-1 ml-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                       size="sm"
                       variant="ghost"
                       onClick={(e) => {
                         e.stopPropagation();
                         onEdit();
                       }}
                       className="p-1 h-6 w-6 hover:bg-muted hover:text-foreground"
                     >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit this motivator</p>
                  </TooltipContent>
                </Tooltip>
                
                <AlertDialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="p-1 h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete this motivator</p>
                    </TooltipContent>
                  </Tooltip>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Motivator</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{motivator.title}"? This action cannot be undone.
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
                  onClick={() => setIsExpanded(!isExpanded)}
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
});

ExpandableMotivatorCard.displayName = 'ExpandableMotivatorCard';