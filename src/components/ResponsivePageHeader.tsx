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
      
      {/* History button on left after voice button */}
      {onHistoryClick && (
        <div className="absolute left-12 top-0 ml-2">
          <HistoryButton onClick={onHistoryClick} title={historyTitle} />
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
      
      {/* Title section with padding for both left buttons and right speech bubble */}
      <div className="pl-20 pr-12">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground text-left">{subtitle}</p>
      </div>
    </div>
  );
};