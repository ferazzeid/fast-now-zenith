import React, { memo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Image, Edit, Trash2, Star, BookOpen } from 'lucide-react';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';
import { useAdminGoalManagement } from '@/hooks/useAdminGoalManagement';
import { useAccess } from '@/hooks/useAccess';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MotivatorContentModal } from '@/components/MotivatorContentModal';
import { useToast } from '@/hooks/use-toast';
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
    linkUrl?: string;
    slug?: string;
    _isSystemMotivator?: boolean;
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
  
  const [isInDefaultGoals, setIsInDefaultGoals] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<{
    id: string;
    title: string;
    content: string;
    external_url?: string;
  } | null>(null);
  const { addToDefaultGoals, removeFromDefaultGoals, checkIfInDefaultGoals, loading: adminLoading } = useAdminGoalManagement();
  const { originalIsAdmin, isAdmin, isTestingMode } = useAccess();
  const { toast } = useToast();
  
  // Show admin features only when actually in admin mode
  const showAdminFeatures = originalIsAdmin && (!isTestingMode || isAdmin);
  
  const shouldShowExpandButton = motivator.content && motivator.content.length > 50;

  // Check if motivator is in default goals
  useEffect(() => {
    const checkDefaultGoals = async () => {
      if (!showAdminFeatures) return;
      const inDefaults = await checkIfInDefaultGoals(motivator.id);
      setIsInDefaultGoals(inDefaults);
    };

    checkDefaultGoals();
  }, [showAdminFeatures, motivator.id, checkIfInDefaultGoals]);

  // Update current image when motivator changes (for realtime updates from database)
  useEffect(() => {
    setCurrentImageUrl(motivator.imageUrl || '');
  }, [motivator.imageUrl]);

  const handleToggleDefaultGoals = async () => {
    if (isInDefaultGoals) {
      const success = await removeFromDefaultGoals(motivator.id);
      if (success) {
        setIsInDefaultGoals(false);
      }
    } else {
      const success = await addToDefaultGoals(motivator);
      if (success) {
        setIsInDefaultGoals(true);
      }
    }
  };

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
  const isSystemMotivator = motivator._isSystemMotivator;
  
  return (
    <Card className={`overflow-hidden relative ${isSavedQuote ? 'bg-gray-900 border-gray-700' : ''}`}>
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
              <div className="flex-1 space-y-1">
                <div className="flex items-center">
                  <h3 className={`font-semibold ${isSavedQuote ? 'text-white' : 'text-warm-text'} ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {motivator.title}
                  </h3>
                </div>
                
                {motivator.content && (
                  <div className={`text-sm ${isSavedQuote ? 'text-gray-200' : 'text-muted-foreground'}`}>
                    {isExpanded ? (
                      <p className="whitespace-pre-wrap">{motivator.content}</p>
                    ) : (
                      <p className="line-clamp-2">{motivator.content}</p>
                    )}
                  </div>
                )}
                
                {/* Read More Link */}
                {motivator.linkUrl && (
                  <div className="mt-3">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReadMore();
                      }}
                      className="h-auto p-0 text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      Read More <BookOpen className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex flex-col gap-1 ml-2">
                {!isSystemMotivator && (
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
                )}

                {/* Admin: Toggle Default Goals Button */}
                {!isSystemMotivator && showAdminFeatures && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleDefaultGoals();
                        }}
                        disabled={adminLoading}
                        className={`p-1 h-6 w-6 ${
                          isInDefaultGoals 
                            ? 'hover:bg-red-500/10 hover:text-red-600' 
                            : 'hover:bg-yellow-500/10 hover:text-yellow-600'
                        }`}
                      >
                        <Star className={`w-3 h-3 ${
                          isInDefaultGoals 
                            ? 'text-yellow-500 fill-yellow-500' 
                            : ''
                        }`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isInDefaultGoals ? 'Remove from default goals' : 'Add to default goals'} (Admin)</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {!isSystemMotivator && (
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
                )}
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
    </Card>
  );
});

ExpandableMotivatorCard.displayName = 'ExpandableMotivatorCard';