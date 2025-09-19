import React, { memo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Image, Edit, Trash2, BookOpen, Eye, EyeOff } from 'lucide-react';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';
import { WeightGoalVisual } from '@/components/WeightGoalVisual';
import { useAccess } from '@/hooks/useAccess';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MotivatorContentModal } from '@/components/MotivatorContentModal';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { isWeightGoal, decodeWeightGoalData, parseWeightGoalContent } from '@/utils/weightGoalUtils';

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
    show_in_animations?: boolean;
  };
  onEdit: () => void;
  onDelete: () => void;
  onToggleAnimation?: (id: string, showInAnimations: boolean) => Promise<void>;
}

export const ExpandableMotivatorCard = memo<ExpandableMotivatorCardProps>(({ 
  motivator, 
  onEdit, 
  onDelete,
  onToggleAnimation
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(motivator.imageUrl || '');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [localShowInAnimations, setLocalShowInAnimations] = useState(motivator.show_in_animations ?? true);
  const [isToggling, setIsToggling] = useState(false);
  
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<{
    id: string;
    title: string;
    content: string;
    external_url?: string;
  } | null>(null);
  const { isAdmin } = useAccess();
  const { toast } = useToast();
  
  
  const isWeightGoalMotivator = isWeightGoal(motivator);
  let weightGoalData = null;
  let whyReasons: string[] = [];
  
  if (isWeightGoalMotivator) {
    weightGoalData = decodeWeightGoalData(motivator.content || '{}');
    whyReasons = weightGoalData?.whyReasons || [];
  }
  
  const shouldShowExpandButton = (motivator.content && motivator.content.length > 50) || isWeightGoalMotivator;

  // Update current image when motivator changes (for realtime updates from database)
  useEffect(() => {
    setCurrentImageUrl(motivator.imageUrl || '');
    setLocalShowInAnimations(motivator.show_in_animations ?? true);
  }, [motivator.imageUrl, motivator.show_in_animations]);

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
        {/* Collapsed State: Image on top, title and actions below */}
        {!isExpanded && (
          <div>
            {/* Full-width image/visual at top */}
            <div className="w-full h-32 relative">
              {isWeightGoalMotivator && weightGoalData ? (
                <div className="w-full h-full flex items-center justify-center">
                  <WeightGoalVisual 
                    weight={weightGoalData.weight}
                    unit={weightGoalData.unit}
                    size="sm"
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <MotivatorImageWithFallback
                  src={currentImageUrl}
                  alt={motivator.title}
                  className="w-full h-full object-cover"
                  onAddImageClick={onEdit}
                  showAddImagePrompt={!currentImageUrl}
                />
              )}
            </div>

            {/* Title and actions */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-warm-text flex-1 pr-2">
                  {motivator.title}
                </h3>
                
                {/* Expand button only */}
                {shouldShowExpandButton && (
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsExpanded(true)}
                          className="p-1 h-6 w-6 hover:bg-muted hover:text-foreground"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Show full description</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Expanded State: Vertical layout with full-width image and content */}
        {isExpanded && (
          <div>
            {/* Full-width image/visual at top */}
            <div className="w-full h-48 relative">
              {isWeightGoalMotivator && weightGoalData ? (
                <div className="w-full h-full flex items-center justify-center">
                  <WeightGoalVisual 
                    weight={weightGoalData.weight}
                    unit={weightGoalData.unit}
                    size="md"
                    className="w-full h-full" 
                  />
                </div>
              ) : (
                <MotivatorImageWithFallback
                  src={currentImageUrl}
                  alt={motivator.title}
                  className="w-full h-full object-cover"
                  onAddImageClick={onEdit}
                  showAddImagePrompt={!currentImageUrl}
                />
              )}
            </div>

            {/* Content below image */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-warm-text flex-1">
                  {motivator.title}
                </h3>
                
                {/* Collapse button only */}
                <div className="flex gap-1 ml-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsExpanded(false)}
                        className="p-1 h-6 w-6 hover:bg-muted hover:text-foreground"
                      >
                        <ChevronDown className="w-3 h-3 rotate-180" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Show less</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Full-width content text */}
              {isWeightGoalMotivator ? (
                <div className="space-y-3 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Why I want to reach this weight:</h4>
                    <div className="space-y-1">
                      {whyReasons.map((reason, index) => (
                        <p key={index} className="text-sm text-muted-foreground leading-relaxed">
                          {index + 1}. {reason}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : displayContent ? (
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {displayContent}
                </p>
              ) : null}

              {/* Eye icon, Edit and Delete buttons below content */}
              <div className="flex gap-2 justify-end pt-2 border-t border-subtle">
                {onToggleAnimation && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (isToggling) return;
                          
                          const newValue = !localShowInAnimations;
                          setIsToggling(true);
                          setLocalShowInAnimations(newValue);
                          
                          try {
                            await onToggleAnimation(motivator.id, newValue);
                            toast({
                              description: `Goal ${newValue ? 'will show' : 'hidden from'} in timer animations`,
                            });
                          } catch (error) {
                            setLocalShowInAnimations(!newValue);
                            toast({
                              description: "Failed to update animation setting",
                              variant: "destructive",
                            });
                          } finally {
                            setIsToggling(false);
                          }
                        }}
                        disabled={isToggling}
                        className="flex items-center gap-2"
                      >
                        {isToggling ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : localShowInAnimations ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{localShowInAnimations ? 'Hide from timer animations' : 'Show in timer animations'}</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
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
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDeleteModalOpen(true);
                      }}
                      className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete this motivator</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
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
          variant="default"
        />
      </Card>
  );
});

ExpandableMotivatorCard.displayName = 'ExpandableMotivatorCard';