import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MyFoodsButtonProps {
  onClick: () => void;
  title?: string;
}

export const MyFoodsButton = ({ onClick, title = "Browse food library" }: MyFoodsButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="w-8 h-8 p-0 rounded-full bg-ceramic-plate/80 backdrop-blur-sm border border-ceramic-rim hover:bg-ceramic-plate hover:scale-110 transition-all duration-200"
      title={title}
      aria-label={title}
    >
      <BookOpen className="w-4 h-4 text-warm-text" />
    </Button>
  );
};