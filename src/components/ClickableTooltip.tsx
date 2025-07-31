import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ClickableTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

export const ClickableTooltip: React.FC<ClickableTooltipProps> = ({ 
  children, 
  content, 
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showBelow, setShowBelow] = useState(false);
  const isMobile = useIsMobile();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isMobile) {
      // On mobile, always use click/touch
      setIsOpen(!isOpen);
      
      // Check if we should show below instead of above
      if (triggerRef.current && !isOpen) {
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;
        
        // If less than 120px space above, show below
        setShowBelow(spaceAbove < 120);
      }
    }
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsOpen(true);
      
      // Check positioning for desktop hover too
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceAbove = rect.top;
        setShowBelow(spaceAbove < 120);
      }
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsOpen(false);
    }
  };

  // Close on outside click for mobile
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

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        className={cn(
          "cursor-pointer transition-colors duration-200",
          isMobile && "active:bg-accent/20 rounded-md p-1 -m-1",
          className
        )}
        onClick={handleToggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      
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
              "absolute z-50 px-3 py-2 text-sm text-popover-foreground bg-popover border border-border rounded-md shadow-lg",
              "w-[160px] text-left leading-relaxed",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              // Smart positioning based on available space
              showBelow 
                ? "top-full right-0 mt-2" 
                : "bottom-full right-0 mb-2"
            )}
          >
            {content}
            {/* Arrow pointing to trigger */}
            <div className={cn(
              "absolute right-4",
              showBelow 
                ? "top-0 -mt-1 w-2 h-2 bg-popover border-l border-t border-border rotate-45"
                : "bottom-0 -mb-1 w-2 h-2 bg-popover border-r border-b border-border rotate-45"
            )} />
          </div>
        </>
      )}
    </div>
  );
};