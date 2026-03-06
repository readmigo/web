'use client';

import * as amplitude from '@amplitude/analytics-browser';
import { useEffect } from 'react';

const AMPLITUDE_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;

export function initAmplitude() {
  if (typeof window === 'undefined' || !AMPLITUDE_KEY) return;
  amplitude.init(AMPLITUDE_KEY, {
    defaultTracking: {
      pageViews: false,
      sessions: true,
      formInteractions: false,
      fileDownloads: false,
    },
  });
}

export function AmplitudeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAmplitude();
  }, []);

  return <>{children}</>;
}

export { amplitude };
