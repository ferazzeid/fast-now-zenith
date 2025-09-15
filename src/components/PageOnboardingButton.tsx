import { Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageOnboardingButtonProps {
  onClick: () => void;
}

export const PageOnboardingButton = ({ onClick }: PageOnboardingButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="w-8 h-8 p-0 rounded-full bg-ceramic-plate/80 backdrop-blur-sm border-ceramic-shadow hover:bg-ceramic-plate hover:scale-110 transition-all duration-200"
      title="Learn about this page"
    >
      <Brain className="w-4 h-4 text-warm-text" />
    </Button>
  );
};