import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatSaveStatusProps {
  status: 'saved' | 'saving' | 'offline' | 'error';
  isOnline: boolean;
  className?: string;
}

export const ChatSaveStatus = ({ status, isOnline, className }: ChatSaveStatusProps) => {
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (status === 'saving' || status === 'offline' || status === 'error') {
      setShowStatus(true);
    } else if (status === 'saved') {
      setShowStatus(true);
      // Auto-hide after 2 seconds when saved
      const timer = setTimeout(() => setShowStatus(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!showStatus) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          text: 'Saving...',
          className: 'text-blue-600 animate-spin'
        };
      case 'saved':
        return {
          icon: CheckCircle,
          text: 'Saved',
          className: 'text-green-600'
        };
      case 'offline':
        return {
          icon: WifiOff,
          text: 'Offline - saved locally',
          className: 'text-orange-600'
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Save failed - saved locally',
          className: 'text-red-600'
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  const { icon: Icon, text, className: iconClassName } = config;

  return (
    <div className={cn(
      "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm border border-border/50",
      className
    )}>
      <Icon size={12} className={iconClassName} />
      <span className={iconClassName.replace('animate-spin', '')}>{text}</span>
    </div>
  );
};