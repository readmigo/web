'use client';

import { useEffect, type ReactNode } from 'react';
import { initAmplitude } from './amplitude';

interface AmplitudeProviderProps {
  children: ReactNode;
}

export function AmplitudeProvider({ children }: AmplitudeProviderProps) {
  useEffect(() => {
    initAmplitude();
  }, []);

  return <>{children}</>;
}
