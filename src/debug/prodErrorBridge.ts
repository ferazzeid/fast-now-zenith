/** Bridge JS errors to Logcat in production. Safe on web & native. */
const isNative = typeof window !== 'undefined' && (window as any).Capacitor;

function safeLog(level: 'log'|'warn'|'error', ...args: any[]) {
  try { console[level](...args); } catch { /* no-op */ }
}

if (typeof window !== 'undefined') {
  // Window errors
  window.addEventListener('error', (e) => {
    safeLog('error', '[GlobalError]', e.message, e.filename, e.lineno, e.colno, e.error?.stack);
  });
  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    safeLog('error', '[UnhandledRejection]', e.reason);
  });

  // Tag console.* with prefix to grep in logcat
  const tag = '[WEBVIEW]';
  ['log','warn','error'].forEach((k) => {
    const orig = (console as any)[k];
    (console as any)[k] = (...args: any[]) => orig.call(console, tag, ...args);
  });
}

export {};