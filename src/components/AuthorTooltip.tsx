import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface AuthorTooltipProps {
  content: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AuthorTooltip: React.FC<AuthorTooltipProps> = ({
  content,
  size = 'md',
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const [alignLeft, setAlignLeft] = useState(false);
  const [authorData, setAuthorData] = useState({
    image: '/lovable-uploads/default-author.png',
    name: 'Admin',
    title: 'Personal Insight'
  });
  
  const isMobile = useIsMobile();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Load author settings
  useEffect(() => {
    const loadAuthorData = async () => {
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
            image: settingsMap.author_tooltip_image || '/lovable-uploads/default-author.png',
            name: settingsMap.author_tooltip_name || 'Admin',
            title: settingsMap.author_tooltip_title || 'Personal Insight'
          });
        }
      } catch (error) {
        console.error('Failed to load author data:', error);
      }
    };

    loadAuthorData();
  }, []);

  const recomputePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 280; // Known width from tooltip
    const tooltipHeight = 160; // Estimated height for calculation
    
    const spaceAbove = triggerRect.top;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceRight = window.innerWidth - triggerRect.right;
    const spaceLeft = triggerRect.left;
    
    // Determine vertical position (prefer top unless insufficient space)
    setPosition(spaceAbove >= tooltipHeight ? 'top' : 'bottom');
    
    // Determine horizontal alignment (prefer right-aligned, only use left if insufficient space)
    // For right-aligned: tooltip appears to the right of trigger, extending rightward
    // For left-aligned: tooltip appears to the left of trigger, extending leftward
    setAlignLeft(spaceRight < tooltipWidth);
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

  const handleMouseLeave = () => {
    if (!isMobile) setIsOpen(false);
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
            className={cn(
              "absolute z-50 px-4 py-3 bg-popover border border-border rounded-lg shadow-xl",
              "w-[280px] max-w-[calc(100vw-32px)] text-left",
              "animate-fade-in",
              position === 'bottom' 
                ? (alignLeft ? "top-full left-0 mt-3" : "top-full left-0 mt-3")
                : (alignLeft ? "bottom-full left-0 mb-3" : "bottom-full left-0 mb-3")
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
            <div className="text-sm text-popover-foreground leading-relaxed">
              {content}
            </div>

            {/* Speech bubble arrow */}
            <div className={cn(
              "absolute w-3 h-3 bg-popover border-border rotate-45",
              "left-6", // Always position arrow consistently on left side
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