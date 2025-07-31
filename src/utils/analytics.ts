declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const initializeAnalytics = (measurementId: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    // Replace placeholder in script tags
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.src.includes('GA_MEASUREMENT_ID')) {
        script.src = script.src.replace('GA_MEASUREMENT_ID', measurementId);
      }
      if (script.textContent?.includes('GA_MEASUREMENT_ID')) {
        script.textContent = script.textContent.replace(/GA_MEASUREMENT_ID/g, measurementId);
      }
    });
    
    window.gtag('config', measurementId);
  }
};

export const trackPageView = (path: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: path,
    });
  }
};

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
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