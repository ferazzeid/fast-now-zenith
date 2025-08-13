import React, { memo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Image, Edit, Trash2, Star } from 'lucide-react';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';
import { RegenerateImageButton } from './RegenerateImageButton';
import { PremiumGatedRegenerateButton } from './PremiumGatedRegenerateButton';
import { useImageGenerationStatus } from '@/hooks/useImageGenerationStatus';
import { useAdminGoalManagement } from '@/hooks/useAdminGoalManagement';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
  const [currentImageUrl, setCurrentImageUrl] = useState(motivator.imageUrl || '');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInDefaultGoals, setIsInDefaultGoals] = useState(false);
  const { getGenerationStatus } = useImageGenerationStatus();
  const { addToDefaultGoals, checkIfInDefaultGoals, loading: adminLoading } = useAdminGoalManagement();
  const { user } = useAuth();
  
  const shouldShowExpandButton = motivator.content && motivator.content.length > 50;
  const generationStatus = getGenerationStatus(motivator.id);
  const isGenerating = generationStatus === 'generating' || generationStatus === 'pending';

  const handleImageGenerated = (newImageUrl: string) => {
    setCurrentImageUrl(newImageUrl);
  };

  // Check admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });
        
        if (error) throw error;
        setIsAdmin(data || false);
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      }
    };

    checkAdminRole();
  }, [user]);

  // Check if motivator is in default goals
  useEffect(() => {
    const checkDefaultGoals = async () => {
      if (!isAdmin) return;
      const inDefaults = await checkIfInDefaultGoals(motivator.id);
      setIsInDefaultGoals(inDefaults);
    };

    checkDefaultGoals();
  }, [isAdmin, motivator.id, checkIfInDefaultGoals]);

  // Update current image when motivator changes (for realtime updates from database)
  useEffect(() => {
    setCurrentImageUrl(motivator.imageUrl || '');
  }, [motivator.imageUrl]);

  const handleAddToDefaultGoals = async () => {
    const success = await addToDefaultGoals(motivator);
    if (success) {
      setIsInDefaultGoals(true);
    }
  };

  return (
    <Card className="overflow-hidden relative">
      <CardContent className="p-0">
        <div className="flex">
          {/* Image */}
          <div className="w-32 h-32 flex-shrink-0 relative">
            <MotivatorImageWithFallback
              src={currentImageUrl}
              alt={motivator.title}
              className={`w-full h-full object-cover ${isGenerating ? 'opacity-50' : ''}`}
              onAddImageClick={onEdit}
              showAddImagePrompt={!currentImageUrl}
            />
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
            {currentImageUrl && (
              <div className="absolute -top-1 -right-1">
                <RegenerateImageButton
                  prompt={`${motivator.title}. ${motivator.content || ''}`}
                  filename={`motivator-${motivator.id}-${Date.now()}.jpg`}
                  onImageGenerated={handleImageGenerated}
                  motivatorId={motivator.id}
                  disabled={isGenerating}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  mode="motivator"
                />
              </div>
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
                  <h3 className={`font-semibold text-warm-text ${isExpanded ? '' : 'line-clamp-2'}`}>
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

                {/* Admin: Add to Default Goals Button */}
                {isAdmin && !isInDefaultGoals && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToDefaultGoals();
                        }}
                        disabled={adminLoading}
                        className="p-1 h-6 w-6 hover:bg-yellow-500/10 hover:text-yellow-600"
                      >
                        <Star className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add to default goals (Admin)</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Show badge if in default goals */}
                {isAdmin && isInDefaultGoals && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-1 h-6 w-6 flex items-center justify-center">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>In default goals</p>
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