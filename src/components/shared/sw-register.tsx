'use client';

import { useEffect } from 'react';

export function SWRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // SW registration may fail on some browsers/environments - non-critical
      });
    }
  }, []);

  return null;
}
