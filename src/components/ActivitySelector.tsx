import { Clock, FootprintsIcon, Camera } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

interface ActivitySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectActivity: (activity: 'fasting' | 'walking' | 'food') => void;
}

export const ActivitySelector = ({ isOpen, onClose, onSelectActivity }: ActivitySelectorProps) => {
  const activities = [
    {
      id: 'fasting' as const,
      title: 'Fasting',
      description: 'Track your fasting session',
      icon: Clock,
      color: 'text-primary'
    },
    {
      id: 'walking' as const,
      title: 'Walking',
      description: 'Track your walking session',
      icon: FootprintsIcon,
      color: 'text-secondary'
    },
    {
      id: 'food' as const,
      title: 'Food Tracking',
      description: 'Log your food intake',
      icon: Camera,
      color: 'text-accent'
    }
  ];

  const handleActivitySelect = (activityId: 'fasting' | 'walking' | 'food') => {
    onSelectActivity(activityId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Choose Activity</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 mt-4">
          {activities.map(({ id, title, description, icon: Icon, color }) => (
            <Button
              key={id}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-muted/50"
              onClick={() => handleActivitySelect(id)}
            >
              <Icon className={`w-6 h-6 ${color}`} />
              <div className="text-center">
                <div className="font-medium">{title}</div>
                <div className="text-sm text-muted-foreground">{description}</div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};