import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

let isAnalyticsInitialized = false;
let currentMeasurementId: string | null = null;

export const initializeAnalytics = async () => {
  // Skip if not in browser environment or already initialized
  if (typeof window === 'undefined' || isAnalyticsInitialized) return;
  
  try {
    // Non-blocking analytics initialization - don't fail app startup
    const { data, error } = await supabase
      .from('shared_settings')
      .select('setting_value')
      .eq('setting_key', 'ga_tracking_id')
      .maybeSingle(); // Use maybeSingle to handle empty results gracefully

    if (error || !data?.setting_value) {
      console.log('No GA tracking ID configured');
      return;
    }

    const measurementId = data.setting_value;
    currentMeasurementId = measurementId;

    // Only load GA scripts in browser environment
    if (typeof document !== 'undefined') {
      // Load GA script dynamically with error handling
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      script1.onerror = () => console.warn('Failed to load Google Analytics script');
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}');
      `;
      document.head.appendChild(script2);

      // Set up gtag function with safety checks
      window.gtag = window.gtag || function() {
        if (typeof window !== 'undefined') {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push(arguments);
        }
      };
    }

    isAnalyticsInitialized = true;
    console.log('Google Analytics initialized with ID:', measurementId);
  } catch (error) {
    // Don't let analytics failures break the app
    console.warn('Analytics initialization failed (non-critical):', error);
  }
};

export const trackPageView = (path: string) => {
  if (typeof window !== 'undefined' && window.gtag && currentMeasurementId) {
    try {
      window.gtag('config', currentMeasurementId, {
        page_path: path,
      });
    } catch (error) {
      console.warn('Failed to track page view:', error);
    }
  }
};

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag && currentMeasurementId) {
    try {
      window.gtag('event', eventName, parameters);
    } catch (error) {
      console.warn('Failed to track event:', error);
    }
  }
};

// Event tracking helpers
export const trackFastingEvent = (action: 'start' | 'stop' | 'pause', fastType: string, duration?: number) => {
  trackEvent('fasting_action', {
    action,
    fast_type: fastType,
    duration_hours: duration ? Math.round(duration / 3600) : undefined,
  });
};

export const trackWalkingEvent = (action: 'start' | 'stop' | 'pause' | 'resume', speed?: number, duration?: number) => {
  trackEvent('walking_action', {
    action,
    speed_mph: speed,
    duration_minutes: duration ? Math.round(duration / 60) : undefined,
  });
};

export const trackFoodEvent = (action: 'add' | 'edit' | 'delete', method?: 'manual' | 'image' | 'voice') => {
  trackEvent('food_tracking', {
    action,
    input_method: method,
  });
};

export const trackMotivatorEvent = (action: 'create' | 'view' | 'edit' | 'delete', category?: string) => {
  trackEvent('motivator_action', {
    action,
    category,
  });
};

export const trackAIEvent = (action: 'chat' | 'food_analysis' | 'voice' | 'tts', model?: string) => {
  trackEvent('ai_usage', {
    action,
    model_used: model,
  });
};

// Analytics API functions for real-time data
export const fetchGoogleAnalyticsData = async () => {
  // This would require Google Analytics Reporting API
  // For now, return mock data structure
  return {
    activeUsers: 0,
    todayUsers: 0,
    yesterdayUsers: 0,
    weeklyTrend: []
  };
};