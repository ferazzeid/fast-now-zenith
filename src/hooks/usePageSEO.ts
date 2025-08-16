import { useEffect } from "react";

interface PageSEOOptions {
  title: string;
  description?: string;
  canonicalPath?: string;
}

export function usePageSEO({ title, description, canonicalPath }: PageSEOOptions) {
  useEffect(() => {
    // Title
    document.title = title;

    // Meta description
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }

    // Canonical link
    if (canonicalPath) {
      const href = `${window.location.origin}${canonicalPath}`;
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    }
  }, [title, description, canonicalPath]);
}
