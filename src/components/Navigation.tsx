import { Heart, MessageCircle, Settings, Utensils } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { TimerModeSelector } from './TimerModeSelector';
import { useTimerNavigation } from '@/hooks/useTimerNavigation';

export const Navigation = () => {
  const location = useLocation();
  const { currentMode, timerStatus, sheetOpen, setSheetOpen, switchMode, formatTime } = useTimerNavigation();

  const navItems = [
    { icon: Heart, label: 'Motivators', path: '/motivators' },
    { icon: Utensils, label: 'Food', path: '/food-tracking' },
    { icon: MessageCircle, label: 'AI Chat', path: '/ai-chat' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-ceramic-plate/95 backdrop-blur-sm border-t border-ceramic-rim px-4 py-2 z-40">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around">
          {/* Timer Mode Selector - Same size as nav items */}
          <div className="flex flex-col items-center py-2 px-3 rounded-xl">
            <TimerModeSelector
              currentMode={currentMode}
              onModeSelect={switchMode}
              timerStatus={timerStatus}
              formatTime={formatTime}
              sheetOpen={sheetOpen}
              onSheetOpenChange={setSheetOpen}
            />
          </div>
          
          {navItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'text-muted-foreground hover:text-warm-text hover:bg-ceramic-rim'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};