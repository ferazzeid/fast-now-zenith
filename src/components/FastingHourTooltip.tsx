import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useAccess } from '@/hooks/useAccess';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { fastingHoursKey } from '@/hooks/optimized/useFastingHoursQuery';

interface FastingHourTooltipProps {
  hour: number;
  existingLog?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FastingHourTooltip: React.FC<FastingHourTooltipProps> = ({
  hour,
  existingLog = '',
  size = 'sm',
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const [alignLeft, setAlignLeft] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(existingLog);
  const [displayContent, setDisplayContent] = useState(existingLog);
  const [isSaving, setIsSaving] = useState(false);
  const [authorData, setAuthorData] = useState({
    image: '/src/assets/motivator-placeholder.jpg',
    name: 'Admin',
    title: 'Personal Experience'
  });
  
  const isMobile = useIsMobile();
  const { isAdmin, loading: adminLoading } = useAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Update content when existingLog changes
  useEffect(() => {
    setDisplayContent(existingLog);
    setEditContent(existingLog);
  }, [existingLog]);

  // Load author settings
  useEffect(() => {
    const loadAuthorSettings = async () => {
      try {
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
            image: settingsMap.author_tooltip_image || '/src/assets/motivator-placeholder.jpg',
            name: settingsMap.author_tooltip_name || 'Admin',
            title: settingsMap.author_tooltip_title || 'Personal Experience'
          });
        }
      } catch (error) {
        console.error('Failed to load author settings:', error);
      }
    };

    loadAuthorSettings();
  }, []);

  const recomputePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 280;
    const tooltipHeight = 160;
    const margin = 16;
    
    const spaceAbove = triggerRect.top;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceRight = window.innerWidth - triggerRect.right;
    const spaceLeft = triggerRect.left;
    
    // Determine vertical position (prefer top unless insufficient space)
    setPosition(spaceAbove >= tooltipHeight ? 'top' : 'bottom');
    
    // Better horizontal positioning to prevent overflow
    let shouldAlignLeft = false;
    if (triggerRect.right + tooltipWidth > window.innerWidth - margin) {
      // Would overflow right edge - align to left side of trigger
      shouldAlignLeft = true;
    } else if (triggerRect.left - tooltipWidth < margin) {
      // Would overflow left edge - align to right side of trigger  
      shouldAlignLeft = false;
    } else {
      // Plenty of space - choose based on available space
      shouldAlignLeft = spaceRight < spaceLeft;
    }
    
    setAlignLeft(shouldAlignLeft);
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
      const relatedTarget = e.relatedTarget as Element;
      if (tooltipRef.current && relatedTarget && tooltipRef.current.contains(relatedTarget)) {
        return;
      }
      setIsOpen(false);
    }
  };

  const handleTooltipMouseLeave = (e: React.MouseEvent) => {
    if (!isMobile) {
      const relatedTarget = e.relatedTarget as Element;
      if (triggerRef.current && relatedTarget && triggerRef.current.contains(relatedTarget)) {
        return;
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
    if (!isAdmin) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('fasting_hours')
        .update({ admin_personal_log: editContent.trim() || null })
        .eq('hour', hour);

      if (error) throw error;

      setDisplayContent(editContent.trim());
      setIsEditing(false);
      
      // Refresh the fasting hours data
      queryClient.removeQueries({ queryKey: fastingHoursKey });
      await queryClient.invalidateQueries({ queryKey: fastingHoursKey });
      await queryClient.refetchQueries({ queryKey: fastingHoursKey });
      
      toast({
        title: "Personal log saved",
        description: `Hour ${hour} experience updated successfully`,
      });
    } catch (error) {
      console.error('Error saving admin log:', error);
      toast({
        title: "Save failed",
        description: "Failed to save your experience. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Don't show for non-admins
  if (!isAdmin) return null;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10', 
    lg: 'w-12 h-12'
  };

  const getPlaceholderContent = () => {
    return `No personal insights recorded for hour ${hour} yet. Click to add your experience and thoughts about this stage of fasting.`;
  };

  return (
    <div className="relative inline-block">
      {/* Speech Bubble Button */}
      <div
        ref={triggerRef}
        className={cn(
          "relative cursor-pointer transition-all duration-500 group",
          "border-2 border-[#dac471] bg-gradient-to-br from-[#dac471]/20 to-[#dac471]/10",
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
        
        {/* Author Image */}
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
              "absolute z-[60] px-4 py-3 bg-popover border border-border rounded-lg shadow-xl",
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
                  Hour {hour} • {authorData.title}
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
                  placeholder={`Record your experience at hour ${hour} of your fast...`}
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
                    disabled={isSaving}
                  >
                    <Save className="w-3 h-3 mr-1" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm text-popover-foreground leading-relaxed mb-2">
                  {displayContent || getPlaceholderContent()}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEditToggle}
                  className="text-xs h-6 px-2 hover:bg-muted"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  {displayContent ? 'Edit' : 'Add Experience'}
                </Button>
              </div>
            )}

            {/* Speech bubble arrow */}
            <div className={cn(
              "absolute w-3 h-3 bg-popover border-border rotate-45",
              alignLeft ? "right-6" : "left-6",
              position === 'bottom' 
                ? "top-0 -mt-1.5 border-l border-t"
                : "bottom-0 -mb-1.5 border-r border-b"
            )} />
          </div>
        </>
      )}
    </div>
  );
};