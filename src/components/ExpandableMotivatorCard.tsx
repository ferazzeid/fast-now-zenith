import React, { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Image, Edit, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  const shouldShowExpandButton = motivator.content && motivator.content.length > 100;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex">
          {/* Image */}
          <div className="w-24 h-24 bg-muted flex items-center justify-center flex-shrink-0">
            {motivator.imageUrl ? (
              <img 
                src={motivator.imageUrl} 
                alt={motivator.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Image className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
         
          {/* Content */}
          <div className="flex-1 p-4 pr-2">
            <div className="flex items-start justify-between h-full">
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-warm-text line-clamp-1">
                    {motivator.title}
                  </h3>
                  {shouldShowExpandButton && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsExpanded(!isExpanded)}
                          className="p-1 h-6 w-6"
                        >
                          <ChevronDown 
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`} 
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isExpanded ? 'Show less' : 'Show full description'}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
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
                
                {motivator.category && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                      {motivator.category}
                    </Badge>
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
                      onClick={onEdit}
                      className="p-1 h-6 w-6"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit this motivator</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="p-1 h-6 w-6"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete this motivator</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ExpandableMotivatorCard.displayName = 'ExpandableMotivatorCard';