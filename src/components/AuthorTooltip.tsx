import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useAccess } from '@/hooks/useAccess';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthorTooltipProps {
  contentKey?: string; // Unique key for database content
  content: string; // Fallback content if no database content exists
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AuthorTooltip: React.FC<AuthorTooltipProps> = ({
  contentKey,
  content,
  size = 'md',
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const [alignLeft, setAlignLeft] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [displayContent, setDisplayContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [authorData, setAuthorData] = useState({
    image: '/lovable-uploads/35e63514-5dab-4550-b7be-aecaa8dc8535.png', // Use existing placeholder from project
    name: 'Admin',
    title: 'Personal Insight'
  });
  
  const isMobile = useIsMobile();
  const { isAdmin, loading: adminLoading } = useAccess();
  const { toast } = useToast();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Load author settings and content
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load author settings
        const { data: settings } = await supabase
          .from('shared_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['author_tooltip_image', 'author_tooltip_name', 'author_tooltip_title']);

        if (settings) {
          const settingsMap = settings.reduce((acc, setting) => {
            acc[setting.setting_key] = setting.setting_value;
            return acc;
          }, {} as Record<string, string>);

          setAuthorData({
            image: settingsMap.author_tooltip_image || '/lovable-uploads/35e63514-5dab-4550-b7be-aecaa8dc8535.png',
            name: settingsMap.author_tooltip_name || 'Admin',
            title: settingsMap.author_tooltip_title || 'Personal Insight'
          });
        }

        // Load content if contentKey is provided
        if (contentKey) {
          const { data: contentData } = await supabase
            .from('tooltip_content')
            .select('content')
            .eq('content_key', contentKey)
            .maybeSingle();

          if (contentData) {
            setDisplayContent(contentData.content);
            setEditContent(contentData.content);
          }
        }
      } catch (error) {
        console.error('Failed to load author data:', error);
      }
    };

    loadData();
  }, [contentKey]);

  const recomputePosition = () => {
    if (!triggerRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 280;
    const tooltipHeight = 200; // Slightly larger estimate
    const margin = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate available space in all directions
    const spaceAbove = triggerRect.top;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceLeft = triggerRect.left;
    const spaceRight = viewportWidth - triggerRect.right;
    
    // For tooltips in the top area of the screen, always position to bottom-left
    const isInTopArea = triggerRect.top < viewportHeight * 0.4; // Top 40% of screen
    
    if (isInTopArea) {
      // Always position bottom-left for top area tooltips
      setPosition('bottom');
      setAlignLeft(true);
    } else {
      // For other areas, use smart positioning
      const shouldPositionBottom = spaceBelow >= tooltipHeight + margin;
      setPosition(shouldPositionBottom ? 'bottom' : 'top');
      
      const shouldAlignLeft = spaceRight < tooltipWidth + margin;
      setAlignLeft(shouldAlignLeft);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMobile) {
      setIsOpen(!isOpen);
      if (!isOpen) recomputePosition();
    }
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsOpen(true);
      recomputePosition();
    }
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (!isMobile) {
      // Check if mouse is moving to the tooltip
      const relatedTarget = e.relatedTarget as Element;
      if (tooltipRef.current && relatedTarget && tooltipRef.current.contains(relatedTarget)) {
        return; // Don't close if moving to tooltip
      }
      setIsOpen(false);
    }
  };

  const handleTooltipMouseLeave = (e: React.MouseEvent) => {
    if (!isMobile) {
      // Check if mouse is moving back to trigger
      const relatedTarget = e.relatedTarget as Element;
      if (triggerRef.current && relatedTarget && triggerRef.current.contains(relatedTarget)) {
        return; // Don't close if moving back to trigger
      }
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen && tooltipRef.current && triggerRef.current) {
        if (!tooltipRef.current.contains(event.target as Node) && 
            !triggerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    if (isMobile && isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobile, isOpen]);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditContent(displayContent); // Reset on cancel
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!contentKey || !isAdmin) return;
    
    setIsSaving(true);
    try {
      await supabase
        .from('tooltip_content')
        .upsert({ 
          content_key: contentKey, 
          content: editContent 
        }, { onConflict: 'content_key' });

      setDisplayContent(editContent);
      setIsEditing(false);
      
      toast({
        title: "Content saved",
        description: "Tooltip content has been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Save failed",
        description: "Failed to save content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12', 
    lg: 'w-14 h-14'
  };

  return (
    <div className="relative inline-block">
      {/* Speech Bubble Button */}
      <div
        ref={triggerRef}
        className={cn(
          "relative cursor-pointer transition-all duration-500 group",
          "border-2 border-primary bg-gradient-to-br from-primary/20 to-primary/10",
          "author-tooltip-bubble shadow-lg hover:shadow-xl",
          "animate-elegant-pulse hover:animate-border-pulse",
          sizeClasses[size],
          isMobile && "active:scale-95",
          className
        )}
        onClick={handleToggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          borderRadius: '50% 50% 50% 10%'
        }}
      >
        {/* Golden Glow Effect */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #dac471 0%, rgba(218, 196, 113, 0.4) 50%, transparent 70%)',
            borderRadius: '50% 50% 50% 10%',
            filter: 'blur(8px)',
            transform: 'scale(1.2)'
          }}
        />
        
        {/* Author Image with loading fallback */}
        <img
          src={authorData.image}
          alt={authorData.name}
          className={cn(
            "w-full h-full object-cover transition-all duration-300",
            "filter grayscale group-hover:grayscale-0 group-hover:scale-110"
          )}
          style={{
            borderRadius: '50% 50% 50% 10%'
          }}
          onError={(e) => {
            // Fallback to a solid color background if image fails to load
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.style.background = 'linear-gradient(135deg, #dac471 0%, #b8a355 100%)';
          }}
        />
      </div>

      {/* Tooltip Content */}
      {isOpen && (
        <>
          {isMobile && (
            <div 
              className="fixed inset-0 z-40 bg-transparent" 
              onClick={() => setIsOpen(false)}
            />
          )}
          <div
            ref={tooltipRef}
            onMouseLeave={handleTooltipMouseLeave}
            className={cn(
              "absolute z-[60] px-4 py-3 bg-popover border border-subtle rounded-lg shadow-xl",
              "w-[280px] max-w-[calc(100vw-32px)] text-left",
              "animate-fade-in",
              position === 'bottom' 
                ? (alignLeft ? "top-full right-0 mt-3" : "top-full left-0 mt-3")
                : (alignLeft ? "bottom-full right-0 mb-3" : "bottom-full left-0 mb-3")
            )}
          >
            {/* Header */}
            <div className="flex items-center space-x-3 mb-3">
              <img
                src={authorData.image}
                alt={authorData.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <div className="font-semibold text-sm text-foreground">
                  {authorData.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {authorData.title}
                </div>
              </div>
            </div>
            
            {/* Content */}
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="text-sm leading-relaxed min-h-[80px] resize-none"
                  placeholder="Enter tooltip content..."
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditToggle}
                    disabled={isSaving}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || editContent.trim() === ''}
                  >
                    <Save className="w-3 h-3 mr-1" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm text-popover-foreground leading-relaxed mb-2">
                  {displayContent}
                </div>
                {isAdmin && !adminLoading && contentKey && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEditToggle}
                    className="text-xs h-6 px-2 hover:bg-muted"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};