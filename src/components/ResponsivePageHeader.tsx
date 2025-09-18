import { AuthorTooltip } from '@/components/AuthorTooltip';
import { HistoryButton } from '@/components/HistoryButton';
import { MyFoodsButton } from '@/components/MyFoodsButton';
import { InlineTextFoodInput } from '@/components/InlineTextFoodInput';
import { useAuthorTooltipEnabled } from '@/hooks/useAuthorTooltipEnabled';
import { ReactNode } from 'react';

interface ResponsivePageHeaderProps {
  title: string;
  subtitle: string;
  leftButton?: ReactNode;
  onHistoryClick?: () => void;
  historyTitle?: string;
  onMyFoodsClick?: () => void;
  myFoodsTitle?: string;
  onFoodAdded?: (foods: any[]) => void;
  showAuthorTooltip?: boolean;
  authorTooltipContent?: string;
  authorTooltipContentKey?: string;
  className?: string;
}

export const ResponsivePageHeader = ({
  title,
  subtitle,
  leftButton,
  onHistoryClick,
  historyTitle = "View past entries",
  onMyFoodsClick,
  myFoodsTitle = "Browse food library",
  onFoodAdded,
  showAuthorTooltip = false,
  authorTooltipContent,
  authorTooltipContentKey,
  className = ""
}: ResponsivePageHeaderProps) => {
  const isAuthorTooltipEnabled = useAuthorTooltipEnabled();
  return (
    <div className={`mb-4 mt-4 relative ${className}`}>
      {/* Left button (AIVoiceButton) */}
      {leftButton && (
        <div className="absolute left-0 top-0">
          {leftButton}
        </div>
      )}
      
      {/* Speech bubble always on far right */}
      {showAuthorTooltip && isAuthorTooltipEnabled && (
        <div className="absolute right-0 top-0">
          <AuthorTooltip 
            contentKey={authorTooltipContentKey}
            content={authorTooltipContent}
            size="md"
          />
        </div>
      )}
      
      {/* Title section with conditional padding based on buttons */}
      <div className={`${leftButton ? 'pl-12' : 'pl-0'} pr-20`}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-foreground flex-shrink-0">
            {title}
          </h1>
           {/* Right side navigation - positioned relative for dropdown */}
           <div className="flex items-center gap-1 sm:gap-2 relative justify-end">
            {onHistoryClick && (
              <HistoryButton onClick={onHistoryClick} title={historyTitle} />
            )}
            {onMyFoodsClick && (
              <MyFoodsButton onClick={onMyFoodsClick} title={myFoodsTitle} />
            )}
            {onFoodAdded && (
              <InlineTextFoodInput onFoodAdded={onFoodAdded} />
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-left">{subtitle}</p>
      </div>
    </div>
  );
};