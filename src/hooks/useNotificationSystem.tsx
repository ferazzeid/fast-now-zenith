import { useState, useEffect, useMemo } from 'react';
import { useProfile } from './useProfile';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  type: 'profile_incomplete' | 'subscription_upsell' | 'general';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actions?: {
    primary?: {
      label: string;
      action: string; // 'navigate' | 'dismiss' | 'custom'
      target?: string; // route or custom action
    };
    secondary?: {
      label: string;
      action: string;
      target?: string;
    };
  };
  autoShow?: boolean; // Whether to auto-show this notification when AI chat opens
  persistent?: boolean; // Whether notification persists until manually resolved
  metadata?: Record<string, any>;
}

export const useNotificationSystem = () => {
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const { profile, isProfileComplete } = useProfile();
  const { user } = useAuth();

  // Load dismissed notifications from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissed_notifications');
    if (dismissed) {
      setDismissedNotifications(new Set(JSON.parse(dismissed)));
    }
  }, []);

  // Save dismissed notifications to localStorage
  const saveDismissedNotifications = (dismissed: Set<string>) => {
    localStorage.setItem('dismissed_notifications', JSON.stringify([...dismissed]));
  };

  // Generate notifications based on current state using useMemo to prevent infinite loops
  const notifications = useMemo(() => {
    if (!user) return [];

    const currentNotifications: Notification[] = [];

    // Profile incomplete notification
    if (!isProfileComplete()) {
      const missingFields = [];
      if (!profile?.weight) missingFields.push('weight');
      if (!profile?.height) missingFields.push('height');
      if (!profile?.age) missingFields.push('age');

      const profileNotification: Notification = {
        id: 'profile_incomplete',
        type: 'profile_incomplete',
        priority: 'high',
        title: 'Profile Information Needed',
        message: `I need your ${missingFields.join(', ')} to calculate your daily calorie burn and provide accurate recommendations. This is essential for the app to work properly.`,
        actions: {
          primary: {
            label: 'Tell me now',
            action: 'chat_input',
          },
          secondary: {
            label: 'Go to Settings',
            action: 'navigate',
            target: '/settings',
          },
        },
        autoShow: true,
        persistent: true,
        metadata: {
          missingFields,
        },
      };

      if (!dismissedNotifications.has(profileNotification.id)) {
        currentNotifications.push(profileNotification);
      }
    }

    return currentNotifications;
  }, [user, profile, isProfileComplete, dismissedNotifications]);

  const dismissNotification = (notificationId: string) => {
    const newDismissed = new Set(dismissedNotifications);
    newDismissed.add(notificationId);
    setDismissedNotifications(newDismissed);
    saveDismissedNotifications(newDismissed);
  };

  const clearNotification = (notificationId: string) => {
    dismissNotification(notificationId);
  };

  const getHighPriorityNotifications = () => {
    return notifications.filter(n => n.priority === 'high');
  };

  const hasActiveNotifications = () => {
    // Check for incomplete profile first
    if (profile && (!profile.weight || !profile.height || !profile.age)) {
      return true;
    }
    
    return notifications.length > 0;
  };

  const getAutoShowNotifications = () => {
    return notifications.filter(n => n.autoShow);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'profile_incomplete':
        return 'exclamation-triangle';
      case 'subscription_upsell':
        return 'crown';
      case 'general':
      default:
        return 'info';
    }
  };

  const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
    if (type === 'profile_incomplete') return 'text-amber-500';
    if (type === 'subscription_upsell') return 'text-purple-500';
    if (priority === 'high') return 'text-red-500';
    if (priority === 'medium') return 'text-orange-500';
    return 'text-info-foreground';
  };

  return {
    notifications,
    dismissNotification,
    clearNotification,
    hasActiveNotifications,
    getHighPriorityNotifications,
    getAutoShowNotifications,
    getNotificationIcon,
    getNotificationColor,
  };
};