import { AuthorTooltip } from '@/components/AuthorTooltip';
import { HistoryButton } from '@/components/HistoryButton';
import { ReactNode } from 'react';

interface ResponsivePageHeaderProps {
  title: string;
  subtitle: string;
  leftButton?: ReactNode;
  onHistoryClick?: () => void;
  historyTitle?: string;
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
  showAuthorTooltip = false,
  authorTooltipContent,
  authorTooltipContentKey,
  className = ""
}: ResponsivePageHeaderProps) => {
  return (
    <div className={`mb-4 mt-4 relative ${className}`}>
      {/* Left button (AIVoiceButton) */}
      {leftButton && (
        <div className="absolute left-0 top-0">
          {leftButton}
        </div>
      )}
      
      {/* Speech bubble always on far right */}
      {showAuthorTooltip && (
        <div className="absolute right-0 top-0">
          <AuthorTooltip 
            contentKey={authorTooltipContentKey}
            content={authorTooltipContent}
            size="md"
          />
        </div>
      )}
      
      {/* Title section with padding for left voice button and right speech bubble */}
      <div className="pl-12 pr-12">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-foreground">
            {title}
          </h1>
          {onHistoryClick && (
            <HistoryButton onClick={onHistoryClick} title={historyTitle} />
          )}
        </div>
        <p className="text-sm text-muted-foreground text-left">{subtitle}</p>
      </div>
    </div>
  );
};