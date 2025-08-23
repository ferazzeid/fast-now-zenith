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
  const [alignLeft, setAlignLeft] = useState(false);
  const isMobile = useIsMobile();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const recomputePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 180;
    const tooltipHeight = 120;
    const margin = 16;
    
    const spaceAbove = rect.top - margin;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceLeft = rect.left - margin;
    const spaceRight = window.innerWidth - rect.right - margin;
    
    // Prefer showing above if there's enough space, otherwise below
    const showBelow = spaceAbove < tooltipHeight && spaceBelow >= tooltipHeight;
    
    // Prefer right alignment, but use left if there's more space or not enough space on right
    const alignLeft = spaceRight < tooltipWidth && spaceLeft >= tooltipWidth;
    
    setShowBelow(showBelow);
    setAlignLeft(alignLeft);
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
              "w-[180px] max-w-[calc(100vw-32px)] text-left leading-relaxed",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              showBelow 
                ? (alignLeft ? "top-full left-0 mt-2" : "top-full right-0 mt-2")
                : (alignLeft ? "bottom-full left-0 mb-2" : "bottom-full right-0 mb-2")
            )}
          >
            {content}
            <div className={cn(
              "absolute",
              alignLeft ? "left-4" : "right-4",
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
