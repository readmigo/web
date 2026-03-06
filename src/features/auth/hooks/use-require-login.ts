'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Hook aligned with iOS AuthManager.requireLogin(for:).
 * Returns a guard function that shows login prompt if not authenticated.
 */
export function useRequireLogin() {
  const { data: session } = useSession();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [promptFeature, setPromptFeature] = useState<string>('');

  const isAuthenticated = !!session?.user;

  const requireLogin = useCallback(
    (feature?: string): boolean => {
      if (isAuthenticated) return true;
      setPromptFeature(feature || '');
      setShowLoginPrompt(true);
      return false;
    },
    [isAuthenticated],
  );

  const dismissPrompt = useCallback(() => {
    setShowLoginPrompt(false);
  }, []);

  return {
    isAuthenticated,
    requireLogin,
    showLoginPrompt,
    promptFeature,
    dismissPrompt,
  };
}
