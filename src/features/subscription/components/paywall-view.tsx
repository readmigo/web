'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { usePostHog } from 'posthog-js/react';
import {
  X,
  Sparkles,
  Star,
  BookOpen,
  Headphones,
  Volume2,
  Download,
  BarChart3,
  Palette,
  Trophy,
  Gift,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubscriptionPeriod } from '../types';

const PRO_FEATURES = [
  { icon: BookOpen, labelKey: 'features.allBooks' },
  { icon: Headphones, labelKey: 'features.audiobooks' },
  { icon: Volume2, labelKey: 'features.cloudTTS' },
  { icon: Download, labelKey: 'features.offline' },
  { icon: BarChart3, labelKey: 'features.stats' },
  { icon: Palette, labelKey: 'features.templates' },
] as const;

interface PlanOption {
  id: SubscriptionPeriod;
  labelKey: string;
  price: string;
  perMonth?: string;
  savings?: string;
  hasTrial: boolean;
  isBestValue: boolean;
}

const PLANS: PlanOption[] = [
  {
    id: 'weekly',
    labelKey: 'plans.weekly',
    price: '$2.99',
    hasTrial: false,
    isBestValue: false,
  },
  {
    id: 'monthly',
    labelKey: 'plans.monthly',
    price: '¥38',
    perMonth: '¥38',
    hasTrial: false,
    isBestValue: false,
  },
  {
    id: 'yearly',
    labelKey: 'plans.yearly',
    price: '¥198',
    perMonth: '¥16.5',
    savings: '48%',
    hasTrial: true,
    isBestValue: true,
  },
];

interface PaywallViewProps {
  triggerSource?: string;
  onDismiss: () => void;
}

export function PaywallView({ triggerSource, onDismiss }: PaywallViewProps) {
  const t = useTranslations('subscription');
  const posthog = usePostHog();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPeriod>('yearly');
  const [isLoading, setIsLoading] = useState(false);

  const selected = PLANS.find((p) => p.id === selectedPlan)!;

  const handleSubscribe = useCallback(async () => {
    setIsLoading(true);
    posthog?.capture('purchase_initiated', {
      plan: selectedPlan,
      source: triggerSource,
    });

    try {
      // TODO: Create Stripe Checkout session via API and redirect
      // const { url } = await apiClient.post('/subscriptions/checkout', {
      //   plan: selectedPlan,
      //   successUrl: window.location.href,
      //   cancelUrl: window.location.href,
      // });
      // window.location.href = url;

      // Placeholder: show coming soon
      alert('Stripe integration coming soon');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlan, triggerSource, posthog]);

  // Track view
  useState(() => {
    posthog?.capture('paywall_viewed', { source: triggerSource });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="relative w-full max-w-lg rounded-t-2xl bg-background p-6 pb-8 sm:rounded-2xl sm:pb-6 animate-in slide-in-from-bottom duration-300">
        {/* Close */}
        <button
          className="absolute right-4 top-4 rounded-full p-1 hover:bg-muted"
          onClick={() => {
            posthog?.capture('paywall_dismissed', { source: triggerSource });
            onDismiss();
          }}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center pt-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h2 className="text-xl font-bold">{t('title')}</h2>
            <Sparkles className="h-5 w-5 text-pink-500" />
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Social proof */}
        <div className="mt-4 flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>50,000+ {t('users')}</span>
          <span>·</span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-1">4.8</span>
          </div>
        </div>

        {/* Features */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {PRO_FEATURES.map(({ icon: Icon, labelKey }) => (
            <div key={labelKey} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs">{t(labelKey)}</span>
            </div>
          ))}
        </div>

        {/* Plan selector */}
        <div className="mt-5 flex gap-2">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              className={cn(
                'relative flex-1 rounded-xl border-2 p-3 text-center transition-all',
                selectedPlan === plan.id
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30',
              )}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.isBestValue && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground flex items-center gap-0.5">
                  <Trophy className="h-2.5 w-2.5" />
                  {t('bestValue')}
                </div>
              )}
              <p className="text-xs text-muted-foreground">{t(plan.labelKey)}</p>
              <p className="mt-1 text-lg font-bold">{plan.price}</p>
              {plan.perMonth && (
                <p className="text-[10px] text-muted-foreground">
                  {plan.perMonth}/{t('month')}
                </p>
              )}
              {plan.savings && (
                <p className="mt-1 text-[10px] font-medium text-green-600">
                  {t('save')} {plan.savings}
                </p>
              )}
              {plan.hasTrial && (
                <div className="mt-1 flex items-center justify-center gap-0.5 text-[10px] text-primary">
                  <Gift className="h-2.5 w-2.5" />
                  {t('freeTrial')}
                </div>
              )}
              {selectedPlan === plan.id && (
                <div className="absolute right-1.5 top-1.5">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Subscribe button */}
        <Button
          className="mt-5 h-12 w-full text-base bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white border-0"
          onClick={handleSubscribe}
          disabled={isLoading}
        >
          {isLoading ? (
            t('processing')
          ) : selected.hasTrial ? (
            <>
              <Gift className="mr-2 h-4 w-4" />
              {t('startTrial')}
            </>
          ) : (
            t('subscribe')
          )}
        </Button>

        {/* Legal */}
        <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
          <button className="hover:underline">{t('restore')}</button>
          <span>·</span>
          <button className="hover:underline">{t('terms')}</button>
          <span>·</span>
          <button className="hover:underline">{t('privacy')}</button>
        </div>
      </div>
    </div>
  );
}
