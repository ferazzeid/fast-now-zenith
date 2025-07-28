import { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface RetroactiveFastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: string, startTime: string, fastType: 'intermittent' | 'longterm', duration: number) => void;
}

export const RetroactiveFastModal = ({
  isOpen,
  onClose,
  onConfirm
}: RetroactiveFastModalProps) => {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setHours(today.getHours() - 2); // Default to 2 hours ago
    return today.toISOString().split('T')[0];
  });
  
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    now.setHours(now.getHours() - 2); // Default to 2 hours ago
    return now.toTimeString().slice(0, 5);
  });
  
  const [fastType, setFastType] = useState<'intermittent' | 'longterm'>('intermittent');
  const [duration, setDuration] = useState(16);

  const handleConfirm = () => {
    onConfirm(startDate, startTime, fastType, duration * 3600);
  };

  const isValidDateTime = () => {
    const selectedDateTime = new Date(`${startDate}T${startTime}`);
    const now = new Date();
    return selectedDateTime < now;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-ceramic-plate rounded-3xl p-6 w-full max-w-md border border-ceramic-rim shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-warm-text">Start Fast in Past</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-ceramic-rim"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Date and Time Selection */}
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label className="text-warm-text font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Start Date
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="bg-ceramic-base border-ceramic-rim"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-warm-text font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Start Time
            </Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-ceramic-base border-ceramic-rim"
            />
          </div>
        </div>

        {/* Fast Type Selection */}
        <div className="space-y-4 mb-6">
          <Label className="text-warm-text font-medium">Fast Type</Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={fastType === 'intermittent' ? 'default' : 'outline'}
              onClick={() => {
                setFastType('intermittent');
                setDuration(16);
              }}
              className={`h-16 flex-col space-y-1 ${
                fastType === 'intermittent' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-ceramic-base border-ceramic-rim'
              }`}
            >
              <span className="text-sm font-medium">Intermittent</span>
              <span className="text-xs opacity-75">Daily cycle</span>
            </Button>
            
            <Button
              variant={fastType === 'longterm' ? 'default' : 'outline'}
              onClick={() => {
                setFastType('longterm');
                setDuration(72);
              }}
              className={`h-16 flex-col space-y-1 ${
                fastType === 'longterm' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-ceramic-base border-ceramic-rim'
              }`}
            >
              <span className="text-sm font-medium">Water Fast</span>
              <span className="text-xs opacity-75">Extended</span>
            </Button>
          </div>
        </div>

        {/* Duration Selection */}
        <div className="space-y-4 mb-6">
          <Label className="text-warm-text font-medium">
            Duration: {duration}h
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {fastType === 'intermittent' 
              ? [16, 18, 23].map(hours => (
                  <Button
                    key={hours}
                    variant={duration === hours ? 'default' : 'outline'}
                    onClick={() => setDuration(hours)}
                    className={`h-12 ${
                      duration === hours 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-ceramic-base border-ceramic-rim'
                    }`}
                  >
                    {hours}h
                  </Button>
                ))
              : [24, 48, 72].map(hours => (
                  <Button
                    key={hours}
                    variant={duration === hours ? 'default' : 'outline'}
                    onClick={() => setDuration(hours)}
                    className={`h-12 ${
                      duration === hours 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-ceramic-base border-ceramic-rim'
                    }`}
                  >
                    {hours}h
                  </Button>
                ))
            }
          </div>
        </div>

        {/* Validation Warning */}
        {!isValidDateTime() && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-700">
              Please select a date and time in the past.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-ceramic-base border-ceramic-rim"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValidDateTime()}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
          >
            Start Fast
          </Button>
        </div>
      </div>
    </div>
  );
};