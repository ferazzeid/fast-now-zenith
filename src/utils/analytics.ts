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
  if (isAnalyticsInitialized) return;
  
  try {
    // Fetch GA measurement ID from Supabase
    const { data, error } = await supabase
      .from('shared_settings')
      .select('setting_value')
      .eq('setting_key', 'ga_tracking_id')
      .single();

    if (error || !data?.setting_value) {
      console.log('No GA tracking ID configured');
      return;
    }

    const measurementId = data.setting_value;
    currentMeasurementId = measurementId;

    // Load GA script dynamically
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}');
    `;
    document.head.appendChild(script2);

    // Set up gtag function
    window.gtag = window.gtag || function() {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(arguments);
    };

    isAnalyticsInitialized = true;
    console.log('Google Analytics initialized with ID:', measurementId);
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
  }
};

export const trackPageView = (path: string) => {
  if (typeof window !== 'undefined' && window.gtag && currentMeasurementId) {
    window.gtag('config', currentMeasurementId, {
      page_path: path,
    });
  }
};

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag && currentMeasurementId) {
    window.gtag('event', eventName, parameters);
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