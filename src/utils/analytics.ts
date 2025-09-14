import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Static analytics configuration - no database dependency
let isAnalyticsInitialized = false;
let currentMeasurementId: string | null = null;

// Configure your Google Analytics ID here
const GA_MEASUREMENT_ID = ''; // Add your GA4 measurement ID

export const initializeAnalytics = async () => {
  // Skip if not in browser environment or already initialized or no ID configured
  if (typeof window === 'undefined' || isAnalyticsInitialized || !GA_MEASUREMENT_ID) return;
  
  try {
    currentMeasurementId = GA_MEASUREMENT_ID;

    // Only load GA scripts in browser environment
    if (typeof document !== 'undefined') {
      // Ensure we have a dataLayer first
      window.dataLayer = window.dataLayer || [];
      
      // Set up gtag function immediately
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };
      
      // Initialize GA with config first
      window.gtag('js', new Date());
      window.gtag('config', GA_MEASUREMENT_ID, {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false
      });

      // Load GA script after setup
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      script.onerror = () => console.warn('Failed to load Google Analytics script');
      
      // Insert at beginning of head for better detection
      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript) {
        firstScript.parentNode?.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }
    }

    isAnalyticsInitialized = true;
    console.log('Google Analytics initialized with ID:', GA_MEASUREMENT_ID);
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