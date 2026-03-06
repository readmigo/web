'use client';

import { useState, useCallback } from 'react';
import { useSubscriptionStore } from '../stores/subscription-store';
import { checkFeatureAccess } from '../services/feature-gate';
import type { GatedFeature, FeatureAccessResult } from '../types';

export function useFeatureGate() {
  const tier = useSubscriptionStore((s) => s.tier);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallSource, setPaywallSource] = useState<string>('');

  const check = useCallback(
    (feature: GatedFeature): FeatureAccessResult => {
      return checkFeatureAccess(tier, feature);
    },
    [tier],
  );

  const requireFeature = useCallback(
    (feature: GatedFeature, source?: string): boolean => {
      const result = check(feature);
      if (result.type === 'restricted') {
        setPaywallSource(source || feature);
        setShowPaywall(true);
        return false;
      }
      return true;
    },
    [check],
  );

  const dismissPaywall = useCallback(() => {
    setShowPaywall(false);
  }, []);

  return {
    check,
    requireFeature,
    showPaywall,
    paywallSource,
    dismissPaywall,
    isPro: tier === 'PRO' || tier === 'PREMIUM',
    tier,
  };
}
