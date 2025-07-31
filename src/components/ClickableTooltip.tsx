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
          isMobile && "active:bg-accent/50 rounded-md p-1 -m-1",
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
              "absolute z-50 px-3 py-2 text-sm text-popover-foreground bg-popover border border-border rounded-md shadow-md",
              "whitespace-nowrap max-w-[200px] text-center",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              side === 'top' && "bottom-full left-1/2 -translate-x-1/2 mb-2",
              side === 'bottom' && "top-full left-1/2 -translate-x-1/2 mt-2", 
              side === 'left' && "right-full top-1/2 -translate-y-1/2 mr-2",
              side === 'right' && "left-full top-1/2 -translate-y-1/2 ml-2"
            )}
            style={{
              // Ensure consistent positioning in top-right corner of parent
              ...(side === 'top' && { left: '75%', transform: 'translateX(-75%)' })
            }}
          >
            {content}
            {/* Arrow */}
            <div
              className={cn(
                "absolute w-2 h-2 bg-popover border-l border-t border-border rotate-45",
                side === 'top' && "top-full left-1/2 -translate-x-1/2 -mt-1",
                side === 'bottom' && "bottom-full left-1/2 -translate-x-1/2 -mb-1",
                side === 'left' && "left-full top-1/2 -translate-y-1/2 -ml-1",
                side === 'right' && "right-full top-1/2 -translate-y-1/2 -mr-1"
              )}
            />
          </div>
        </>
      )}
    </div>
  );
};