export type Platform = 'web' | 'android' | 'ios';
export type PaymentProvider = 'stripe' | 'google_play' | 'apple_app_store';

export const detectPlatform = (): Platform => {
  if (typeof window === 'undefined') return 'web';
  
  // For TWA deployment, check if running in Android WebView
  const userAgent = navigator.userAgent;
  if (userAgent.includes('wv') && userAgent.includes('Android')) {
    return 'android'; // TWA on Android
  }
  
  // Fallback detection based on user agent
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    return 'ios';
  } else if (userAgent.includes('Android')) {
    return 'android';
  }
  
  return 'web';
};

export const getPaymentProviderForPlatform = (platform: Platform): PaymentProvider => {
  switch (platform) {
    case 'android':
      return 'google_play';
    case 'ios':
      return 'apple_app_store';
    default:
      return 'stripe';
  }
};

export const isNativePlatform = (platform: Platform): boolean => {
  return platform === 'android' || platform === 'ios';
};

export const getPlatformDisplayName = (platform: Platform): string => {
  switch (platform) {
    case 'android':
      return 'Android';
    case 'ios':
      return 'iOS';
    default:
      return 'Web';
  }
};

export const getPaymentProviderDisplayName = (provider: PaymentProvider): string => {
  switch (provider) {
    case 'google_play':
      return 'Google Play';
    case 'apple_app_store':
      return 'Apple App Store';
    default:
      return 'Stripe';
  }
};