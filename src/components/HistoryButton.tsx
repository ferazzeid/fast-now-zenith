import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HistoryButtonProps {
  onClick: () => void;
  title?: string;
}

export const HistoryButton = ({ onClick, title = "View history" }: HistoryButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="w-8 h-8 p-0 rounded-full bg-ceramic-plate/80 backdrop-blur-sm border border-ceramic-rim hover:bg-ceramic-plate hover:scale-110 transition-all duration-200"
      title={title}
    >
      <History className="w-4 h-4 text-warm-text" />
    </Button>
  );
};