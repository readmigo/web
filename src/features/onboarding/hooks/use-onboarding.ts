'use client';

import { useState, useCallback, useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

const STORAGE_KEY = 'readmigo_onboarding_completed';

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setShowOnboarding(true);
      trackEvent('onboarding_started');
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowOnboarding(false);
  }, []);

  const hasCompletedOnboarding = !showOnboarding;

  return { showOnboarding, completeOnboarding, hasCompletedOnboarding };
}
