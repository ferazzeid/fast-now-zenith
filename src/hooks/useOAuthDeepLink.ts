import { useEffect } from "react";

export function useOAuthDeepLink(callback: (url: string) => void) {
  useEffect(() => {
    // Only run on native
    if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform) {
      // Lazy import to avoid Vite web build errors
      import("@capacitor/app").then(({ App }) => {
        App.addListener("appUrlOpen", (event: any) => {
          if (event?.url) {
            callback(event.url);
          }
        });
      });
    }
  }, [callback]);
}