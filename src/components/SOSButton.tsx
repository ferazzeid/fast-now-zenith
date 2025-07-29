import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SOSButtonProps {
  fastType: 'intermittent' | 'longterm';
  timeElapsed: number;
  goalDuration: number;
  progress: number;
  isInEatingWindow?: boolean;
}

export const SOSButton = ({ fastType, timeElapsed, goalDuration, progress, isInEatingWindow }: SOSButtonProps) => {
  const navigate = useNavigate();

  const handleSOSClick = () => {
    const crisisData = {
      fastType,
      timeElapsed,
      goalDuration,
      progress,
      isInEatingWindow
    };
    
    navigate(`/ai-chat?crisis=true&data=${encodeURIComponent(JSON.stringify(crisisData))}`);
  };

  return (
    <Button
      onClick={handleSOSClick}
      size="sm"
      className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white border-2 border-red-500 z-10"
      aria-label="Emergency SOS - Get help"
    >
      <span className="text-xs font-bold">SOS</span>
    </Button>
  );
};