'use client';

import { useEffect } from 'react';

export default function AppInit() {
  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Ensure model-viewer is defined
    if (typeof window !== 'undefined' && !customElements.get('model-viewer')) {
      const script = document.createElement('script');
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
      script.type = 'module';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  return null;
}
