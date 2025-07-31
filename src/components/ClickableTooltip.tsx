import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ClickableTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const ClickableTooltip: React.FC<ClickableTooltipProps> = ({ 
  children, 
  content, 
  side = 'top',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleToggle = () => {
    if (isMobile) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          "cursor-pointer transition-colors duration-200",
          isMobile && "active:bg-accent/30 rounded-md p-1 -m-1",
          className
        )}
        onClick={handleToggle}
        onMouseEnter={() => !isMobile && setIsOpen(true)}
        onMouseLeave={() => !isMobile && setIsOpen(false)}
      >
        {children}
      </div>
      
      {isOpen && (
        <>
          {isMobile && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
          )}
          <div
            className={cn(
              "absolute z-50 px-3 py-2 text-sm text-popover-foreground bg-popover border border-border rounded-md shadow-lg",
              "w-[160px] text-left leading-relaxed",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              // Always position in top-right corner
              "bottom-full right-0 mb-2 transform translate-x-1"
            )}
          >
            {content}
            {/* Arrow pointing down from bottom of tooltip */}
            <div className="absolute top-full right-4 -mt-1">
              <div className="w-2 h-2 bg-popover border-r border-b border-border rotate-45" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};