'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { trackEvent } from '@/lib/analytics';

const STORAGE_KEY = 'readmigo_onboarding_completed';

export function useOnboarding() {
  const { data: session, status } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    const completed = localStorage.getItem(STORAGE_KEY);
    if (completed) return;

    if (status === 'authenticated') {
      const isNewUser = session?.user?.isNewUser;
      if (isNewUser === true || isNewUser === undefined) {
        setShowOnboarding(true);
        trackEvent('onboarding_started');
      }
      return;
    }

    setShowOnboarding(true);
    trackEvent('onboarding_started');
  }, [status, session]);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowOnboarding(false);
  }, []);

  const hasCompletedOnboarding = !showOnboarding;

  return { showOnboarding, completeOnboarding, hasCompletedOnboarding };
}
