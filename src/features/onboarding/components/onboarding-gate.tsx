'use client';

import { useOnboarding } from '../hooks/use-onboarding';
import { OnboardingView } from './onboarding-view';

export function OnboardingGate() {
  const { showOnboarding, completeOnboarding } = useOnboarding();

  if (!showOnboarding) return null;

  return <OnboardingView onComplete={completeOnboarding} />;
}
