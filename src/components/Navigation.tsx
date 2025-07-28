import { Heart, MessageCircle, Settings, Utensils, Clock, Footprints } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTimerNavigation } from '@/hooks/useTimerNavigation';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useProfile } from '@/hooks/useProfile';

export const Navigation = () => {
  const location = useLocation();
  const { timerStatus, formatTime } = useTimerNavigation();
  const { hasActiveNotifications, getHighPriorityNotifications } = useNotificationSystem();
  const { isProfileComplete } = useProfile();
  const highPriorityNotifications = getHighPriorityNotifications();

  const navItems = [
    { 
      icon: Clock, 
      label: 'Fasting', 
      path: '/',
      badge: timerStatus.fasting.isActive ? formatTime(timerStatus.fasting.timeElapsed) : null
    },
    { 
      icon: Footprints, 
      label: 'Walking', 
      path: '/walking',
      badge: timerStatus.walking.isActive ? formatTime(timerStatus.walking.timeElapsed) : null
    },
    { icon: Utensils, label: 'Food', path: '/food-tracking' },
    { 
      icon: MessageCircle, 
      label: 'AI Chat', 
      path: '/ai-chat',
      hasNotification: hasActiveNotifications()
    },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-ceramic-plate/95 backdrop-blur-sm border-t border-ceramic-rim px-4 py-2 z-40">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around gap-1">
          {/* Navigation Items */}
          {navItems.map(({ icon: Icon, label, path, badge, hasNotification }) => {
            const isActive = location.pathname === path;
            
            return (
              <Link
                key={path}
                to={path}
                className={`relative flex flex-col items-center py-2 px-2 rounded-xl transition-all duration-200 flex-1 min-w-0 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'text-muted-foreground hover:text-warm-text hover:bg-ceramic-rim'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{label}</span>
                
                {/* Notification badge for AI Chat */}
                {hasNotification && (
                  <span className={`absolute -top-1 -right-1 min-w-[16px] h-4 text-xs rounded-full flex items-center justify-center font-medium ${
                    highPriorityNotifications.some(n => n.type === 'profile_incomplete') 
                      ? 'bg-amber-500 text-amber-50' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {highPriorityNotifications.length > 0 ? '!' : '●'}
                  </span>
                )}
                
                {/* Regular badge for other items */}
                {badge && (
                  <div className={`absolute -top-1 -right-1 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[2rem] text-center ${
                    badge === '!' 
                      ? 'bg-red-500' 
                      : 'bg-green-500'
                  }`}>
                    {badge}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};