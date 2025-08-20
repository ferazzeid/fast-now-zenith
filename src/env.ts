export const BUILD_INFO = { 
  version: "62", 
  commit: "diagnostic-build",
  timestamp: new Date().toISOString()
};

// Log build info at startup
if (typeof window !== 'undefined') {
  console.log('[WEBVIEW] Build Info:', BUILD_INFO);
}