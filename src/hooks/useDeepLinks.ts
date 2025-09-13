import { useEffect } from 'react';

type DeepLinkHandler = (url: string) => void;

/**
 * Deep links hook - simplified for TWA deployment
 * TWA handles deep links through Android intent filters
 */
export function useDeepLinks(onUrl: DeepLinkHandler | null) {
  useEffect(() => {
    // Deep links are handled by TWA configuration, not JS
    // TWA automatically routes deep links to the correct URL
    console.log('Deep links handled by TWA configuration');
  }, [onUrl]);
}