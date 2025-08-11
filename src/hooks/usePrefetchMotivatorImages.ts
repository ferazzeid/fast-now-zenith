import { useEffect } from 'react';

// Prefetch and warm browser cache for image URLs. Safe on web and mobile web.
// - Injects <link rel="preload" as="image"> for the first few images
// - Creates Image objects to warm the HTTP cache
// - Optionally stores responses in Cache Storage when available
export function usePrefetchMotivatorImages(urls: string[] = [], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || !urls || urls.length === 0) return;

    const deduped = Array.from(new Set(urls.filter(u => typeof u === 'string' && u.length > 0)));
    if (deduped.length === 0) return;

    // Avoid re-prefetching within the same session
    const sessionKey = 'prefetched-motivator-urls';
    const alreadyPrefetched = new Set<string>(
      JSON.parse(sessionStorage.getItem(sessionKey) || '[]')
    );

    const toPrefetch = deduped.filter(u => !alreadyPrefetched.has(u));
    if (toPrefetch.length === 0) return;

    // Inject limited <link rel="preload"> tags for performance (top few images)
    const topForPreload = toPrefetch.slice(0, 6);
    const createdLinks: HTMLLinkElement[] = [];
    try {
      topForPreload.forEach((url) => {
        // Skip if a preload link already exists
        const existing = document.querySelector(`link[rel="preload"][as="image"][href="${url}"]`);
        if (existing) return;
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
        createdLinks.push(link);
      });
    } catch (e) {
      // noop
    }

    // Warm the image cache via Image objects
    const imgObjects: HTMLImageElement[] = [];
    toPrefetch.forEach((url) => {
      try {
        const img = new Image();
        img.decoding = 'async';
        img.loading = 'eager';
        img.src = url;
        imgObjects.push(img);
      } catch (_) {
        // ignore
      }
    });

    // Cache Storage (best-effort, ignore failures)
    async function cacheImages(urlList: string[]) {
      if (!('caches' in window)) return;
      try {
        const cache = await caches.open('motivator-images-v1');
        await Promise.all(
          urlList.map(async (u) => {
            try {
              const req = new Request(u, { mode: 'no-cors', cache: 'reload' });
              const match = await cache.match(req);
              if (!match) {
                const res = await fetch(req);
                // Opaque responses are fine; best-effort put
                await cache.put(req, res);
              }
            } catch {
              // ignore individual failures
            }
          })
        );
      } catch {
        // ignore
      }
    }

    cacheImages(toPrefetch);

    // Remember prefetched URLs in this session
    const updated = Array.from(new Set([...alreadyPrefetched, ...toPrefetch]));
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Cleanup preload links on unmount
    return () => {
      createdLinks.forEach((l) => l.parentElement?.removeChild(l));
    };
  }, [enabled, JSON.stringify(urls)]);
}
