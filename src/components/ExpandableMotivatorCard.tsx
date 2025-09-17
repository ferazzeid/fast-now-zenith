import React, { memo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Image, Edit, Trash2, BookOpen } from 'lucide-react';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';
import { useAccess } from '@/hooks/useAccess';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MotivatorContentModal } from '@/components/MotivatorContentModal';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface ExpandableMotivatorCardProps {
  motivator: {
    id: string;
    title: string;
    content?: string;
    excerpt?: string;
    imageUrl?: string;
    category?: string;
    linkUrl?: string;
    slug?: string;
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
  const [currentImageUrl, setCurrentImageUrl] = useState(motivator.imageUrl || '');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<{
    id: string;
    title: string;
    content: string;
    external_url?: string;
  } | null>(null);
  const { isAdmin } = useAccess();
  const { toast } = useToast();
  
  const shouldShowExpandButton = motivator.content && motivator.content.length > 50;

  // Update current image when motivator changes (for realtime updates from database)
  useEffect(() => {
    setCurrentImageUrl(motivator.imageUrl || '');
  }, [motivator.imageUrl]);

  const handleReadMore = async () => {
    try {
      // First try to find the full content by slug in system_motivators
      if (motivator.slug) {
        const { data: systemData, error } = await supabase
          .from('system_motivators')
          .select('*')
          .eq('slug', motivator.slug)
          .single();

        if (systemData && !error) {
          setSelectedContent({
            id: systemData.id,
            title: systemData.title,
            content: systemData.content,
            external_url: systemData.link_url
          });
          setShowContentModal(true);
          return;
        }
      }

      // If no slug or not found in system_motivators, try to extract slug from linkUrl
      if (motivator.linkUrl) {
        // Extract slug from URL like "/content/autophagy-clean-up"
        const urlParts = motivator.linkUrl.split('/');
        const slug = urlParts[urlParts.length - 1];

        if (slug) {
          const { data: systemData, error } = await supabase
            .from('system_motivators')
            .select('*')
            .eq('slug', slug)
            .single();

          if (systemData && !error) {
            setSelectedContent({
              id: systemData.id,
              title: systemData.title,
              content: systemData.content,
              external_url: systemData.link_url
            });
            setShowContentModal(true);
            return;
          }
        }
      }

      // Fallback: use the motivator's own content (which might be an excerpt)
      setSelectedContent({
        id: motivator.id,
        title: motivator.title,
        content: motivator.content || '',
        external_url: motivator.linkUrl
      });
      setShowContentModal(true);

    } catch (error) {
      console.error('Error fetching full content:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load full content. Please try again."
      });
    }
  };

  // Special styling for saved quotes
  const isSavedQuote = motivator.category === 'saved_quote';
  
  // All motivators in this component are user motivators, so use full content
  const displayContent = motivator.content;
  
  return (
    <Card className="overflow-hidden relative">
      <CardContent className="p-0">
        <div className="flex">
          {/* Image */}
          <div className="w-32 h-32 flex-shrink-0 relative">
            <MotivatorImageWithFallback
              src={currentImageUrl}
              alt={motivator.title}
              className="w-full h-full object-cover"
              onAddImageClick={onEdit}
              showAddImagePrompt={!currentImageUrl}
            />
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
                <div className="space-y-1">
                  <div className="flex items-center">
                    <h3 className={`font-semibold text-warm-text ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {motivator.title}
                    </h3>
                  </div>
                  
                  {/* User goals show full content, not excerpts */}
                  {displayContent && (
                    <p className={`text-sm text-muted-foreground ${
                      isExpanded ? '' : shouldShowExpandButton ? 'line-clamp-2' : ''
                    }`}>
                      {displayContent}
                    </p>
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

                   
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Button
                         size="sm" 
                         variant="ghost" 
                         onClick={(e) => {
                           e.stopPropagation();
                           setIsDeleteModalOpen(true);
                         }}
                         className="p-1 h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
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
      
      <MotivatorContentModal
        isOpen={showContentModal}
        onClose={() => setShowContentModal(false)}
        content={selectedContent}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          onDelete();
          setIsDeleteModalOpen(false);
        }}
        title="Delete Motivator"
        description={`Are you sure you want to delete "${motivator.title}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </Card>
  );
});

ExpandableMotivatorCard.displayName = 'ExpandableMotivatorCard';