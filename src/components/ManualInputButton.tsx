import { Button } from '@/components/ui/button';
import { useAccess } from '@/hooks/useAccess';

interface ManualInputButtonProps {
  onClick: () => void;
  title?: string;
}

export const ManualInputButton = ({ onClick, title = "Manual food entry" }: ManualInputButtonProps) => {
  const { hasAccess } = useAccess();
  
  // Only show for premium users
  if (!hasAccess) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="w-8 h-8 p-0 rounded-full bg-background/80 backdrop-blur-sm border border-subtle hover:bg-muted/80 hover:scale-110 transition-all duration-200"
      title={title}
      aria-label={title}
    >
      <span className="text-sm font-semibold text-foreground">M</span>
    </Button>
  );
};