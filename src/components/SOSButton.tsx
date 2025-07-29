import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SOSButtonProps {
  onClick: () => void;
}

export const SOSButton = ({ onClick }: SOSButtonProps) => {
  return (
    <Button
      onClick={onClick}
      size="sm"
      className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg border-2 border-red-500 z-10"
      aria-label="Emergency SOS - Get help"
      style={{ right: '16px' }} // Same right position as count direction button
    >
      <span className="text-xs font-bold">SOS</span>
    </Button>
  );
};