'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';

const STORAGE_KEY = 'readmigo_onboarding_completed';

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const posthog = usePostHog();

  useEffect(() => {
    // Check if onboarding has been completed
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setShowOnboarding(true);
      posthog?.capture('onboarding_started');
    }
  }, [posthog]);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowOnboarding(false);
  }, []);

  const hasCompletedOnboarding = !showOnboarding;

  return { showOnboarding, completeOnboarding, hasCompletedOnboarding };
}
