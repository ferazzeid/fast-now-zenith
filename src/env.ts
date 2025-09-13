export const BUILD_INFO = { 
  version: import.meta.env.VITE_APP_VERSION || "114", 
  commit: import.meta.env.VITE_COMMIT_SHA || "production-build",
  timestamp: import.meta.env.PROD ? undefined : new Date().toISOString()
};

// Log build info at startup (development only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('[WEBVIEW] Build Info:', BUILD_INFO);
}