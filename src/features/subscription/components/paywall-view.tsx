'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { trackEvent } from '@/lib/analytics';
import {
  X,
  Sparkles,
  Star,
  Cloud,
  ShieldCheck,
  Headphones,
  BarChart3,
  Palette,
  Trophy,
  Gift,
  Check,
  Loader2,
  AlertTriangle,
  AlertCircle,
  BookOpen,
  Clock,
  MessageCircle,
  Tag,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import type { SubscriptionPeriod, PaywallTrigger } from '../types';
import { useCheckout } from '../hooks/use-checkout';
import { useSubscriptionPlans } from '../hooks/use-subscription-plans';

const PRO_FEATURES = [
  { icon: Cloud, labelKey: 'features.dataSync' },
  { icon: ShieldCheck, labelKey: 'features.cloudBackup' },
  { icon: Headphones, labelKey: 'features.unlimitedAudio' },
  { icon: BarChart3, labelKey: 'features.stats' },
  { icon: Palette, labelKey: 'features.templates' },
] as const;

const FREE_FEATURES = [
  { icon: BookOpen, labelKey: 'freeFeatures.browseLibrary' },
  { icon: Clock, labelKey: 'freeFeatures.dailyAudio' },
  { icon: MessageCircle, labelKey: 'freeFeatures.aiBasic' },
] as const;

type RestoreState = 'idle' | 'loading' | 'success' | 'error';
type PromoState = 'idle' | 'loading' | 'success' | 'error';

interface PaywallViewProps {
  trigger?: PaywallTrigger;
  onDismiss: () => void;
}

export function PaywallView({ trigger = 'general', onDismiss }: PaywallViewProps) {
  const t = useTranslations('subscription');
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPeriod>('yearly');
  const [restoreState, setRestoreState] = useState<RestoreState>('idle');

  // C15: Promo code state
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoState, setPromoState] = useState<PromoState>('idle');
  const [promoError, setPromoError] = useState('');

  const { plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { createCheckoutSession, isPending: checkoutPending, isError: checkoutError, error: checkoutErrorData } = useCheckout();

  const selected = plans.find((p) => p.id === selectedPlan) ?? plans[0];

  // C14: plan_selected event fires when user picks a plan
  const handlePlanSelect = useCallback((planId: SubscriptionPeriod) => {
    const plan = plans.find((p) => p.id === planId);
    trackEvent('plan_selected', {
      plan_id: planId,
      price: plan?.priceDisplay ?? '',
      source: trigger,
    });
    setSelectedPlan(planId);
  }, [plans, trigger]);

  // C14: purchase_initiated with plan_id and price
  const handleSubscribe = useCallback(() => {
    const plan = plans.find((p) => p.id === selectedPlan);
    trackEvent('purchase_initiated', {
      plan_id: selectedPlan,
      price: plan?.priceDisplay ?? '',
      source: trigger,
    });

    createCheckoutSession({
      planId: selectedPlan,
      successUrl: window.location.href,
      cancelUrl: window.location.href,
    });
  }, [selectedPlan, trigger, createCheckoutSession, plans]);

  const restoreMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/subscriptions/restore');
    },
    onMutate: () => {
      setRestoreState('loading');
    },
    onSuccess: async () => {
      // C14: subscription_restored event
      trackEvent('subscription_restored', { source: trigger });
      await queryClient.invalidateQueries({ queryKey: ['subscription', 'status'] });
      setRestoreState('success');
      // Close paywall after a brief moment so user sees success feedback
      setTimeout(onDismiss, 1200);
    },
    onError: () => {
      trackEvent('restore_purchases_failed', { source: trigger });
      setRestoreState('error');
    },
  });

  const handleRestore = useCallback(() => {
    if (restoreState === 'loading') return;
    setRestoreState('idle');
    restoreMutation.mutate();
  }, [restoreState, restoreMutation]);

  // C15: promo code redemption
  const promoMutation = useMutation({
    mutationFn: async (code: string) => {
      await apiClient.post('/subscriptions/redeem-promo', { code });
    },
    onMutate: () => {
      setPromoState('loading');
      setPromoError('');
    },
    onSuccess: async () => {
      setPromoState('success');
      await queryClient.invalidateQueries({ queryKey: ['subscription', 'status'] });
      setTimeout(onDismiss, 1500);
    },
    onError: (err: Error) => {
      setPromoState('error');
      setPromoError(err.message ?? t('promoCode.error'));
    },
  });

  const handlePromoSubmit = useCallback(() => {
    const trimmed = promoCode.trim();
    if (!trimmed || promoState === 'loading') return;
    promoMutation.mutate(trimmed);
  }, [promoCode, promoState, promoMutation]);

  // Track view
  useState(() => {
    trackEvent('paywall_viewed', { source: trigger });
  });

  // C16: only show shimmer when button is in idle state
  const isButtonIdle = !checkoutPending && !plansLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="relative w-full max-w-lg rounded-t-2xl bg-background p-6 pb-8 sm:rounded-2xl sm:pb-6 animate-in slide-in-from-bottom duration-300">
        {/* Close */}
        <button
          className="absolute right-4 top-4 rounded-full p-1 hover:bg-muted"
          onClick={() => {
            trackEvent('paywall_dismissed', { source: trigger });
            onDismiss();
          }}
          aria-label={t('close')}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center pt-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-5 w-5 text-purple-500" aria-hidden="true" />
            <h2 className="text-xl font-bold">
              {trigger === 'general' ? t('title') : t(`triggers.${trigger}.title`)}
            </h2>
            <Sparkles className="h-5 w-5 text-pink-500" aria-hidden="true" />
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {trigger === 'general' ? t('subtitle') : t(`triggers.${trigger}.subtitle`)}
          </p>
        </div>

        {/* Social proof */}
        <div className="mt-4 flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>50,000+ {t('users')}</span>
          <span>·</span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" aria-hidden="true" />
            ))}
            <span className="ml-1">4.8</span>
          </div>
        </div>

        {/* Pro Features grid */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {PRO_FEATURES.map(({ icon: Icon, labelKey }) => (
            <div key={labelKey} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
              <span className="text-xs">{t(labelKey)}</span>
            </div>
          ))}
        </div>

        {/* C13: What's already free block */}
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
            {t('freeFeatures.title')}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {FREE_FEATURES.map(({ icon: Icon, labelKey }) => (
              <div
                key={labelKey}
                className="flex flex-col items-center gap-1 rounded-lg border border-border/50 bg-muted/20 px-2 py-2 text-center"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" aria-hidden="true" />
                <span className="text-[10px] text-muted-foreground/70 leading-tight">{t(labelKey)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan selector */}
        <div className="mt-5 flex gap-2" role="radiogroup" aria-label={t('selectPlan')}>
          {plansLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-24 rounded-xl border-2 border-muted bg-muted/30 animate-pulse"
                  aria-hidden="true"
                />
              ))
            : plans.map((plan) => (
                <button
                  key={plan.id}
                  role="radio"
                  aria-checked={selectedPlan === plan.id}
                  className={cn(
                    'relative flex-1 rounded-xl border-2 p-3 text-center transition-all',
                    selectedPlan === plan.id
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/30',
                  )}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {plan.isBestValue && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground flex items-center gap-0.5">
                      <Trophy className="h-2.5 w-2.5" aria-hidden="true" />
                      {t('bestValue')}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{t(`plans.${plan.id}`)}</p>
                  <p className="mt-1 text-lg font-bold">{plan.priceDisplay}</p>
                  {plan.pricePerMonth && (
                    <p className="text-[10px] text-muted-foreground">
                      {plan.pricePerMonth}/{t('month')}
                    </p>
                  )}
                  {plan.savings && (
                    <p className="mt-1 text-[10px] font-medium text-green-600">
                      {t('save')} {plan.savings}
                    </p>
                  )}
                  {plan.hasTrial && (
                    <div className="mt-1 flex items-center justify-center gap-0.5 text-[10px] text-primary">
                      <Gift className="h-2.5 w-2.5" aria-hidden="true" />
                      {t('freeTrial')}
                    </div>
                  )}
                  {selectedPlan === plan.id && (
                    <div className="absolute right-1.5 top-1.5">
                      <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                  )}
                </button>
              ))}
        </div>

        {/* Checkout error */}
        {checkoutError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{checkoutErrorData?.message ?? t('checkoutError')}</span>
          </div>
        )}

        {/* C16: Subscribe button with shimmer in idle state */}
        <Button
          className="relative mt-5 h-12 w-full overflow-hidden text-base bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white border-0"
          onClick={handleSubscribe}
          disabled={checkoutPending || plansLoading}
        >
          {isButtonIdle && (
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"
              aria-hidden="true"
            />
          )}
          {checkoutPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              {t('processing')}
            </>
          ) : selected?.hasTrial ? (
            <>
              <Gift className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('startTrial')}
            </>
          ) : (
            t('subscribe')
          )}
        </Button>

        {/* Restore feedback */}
        {restoreState === 'success' && (
          <p className="mt-2 text-center text-xs text-green-600" role="status">
            {t('restore.success')}
          </p>
        )}
        {restoreState === 'error' && (
          <p className="mt-2 text-center text-xs text-destructive" role="alert">
            <AlertTriangle className="inline mr-1 h-3 w-3" aria-hidden="true" />
            {t('restore.error')}{' '}
            <a
              href="mailto:support@readmigo.app"
              className="underline hover:text-destructive/80"
            >
              {t('restore.contactSupport')}
            </a>
          </p>
        )}

        {/* C15: Promo code entry */}
        <div className="mt-3">
          {!promoOpen ? (
            <button
              className="flex w-full items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setPromoOpen(true)}
            >
              <Tag className="h-3 w-3" aria-hidden="true" />
              {t('promoCode.cta')}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePromoSubmit(); }}
                placeholder={t('promoCode.placeholder')}
                aria-label={t('promoCode.placeholder')}
                disabled={promoState === 'loading' || promoState === 'success'}
                className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-9 shrink-0"
                onClick={handlePromoSubmit}
                disabled={!promoCode.trim() || promoState === 'loading' || promoState === 'success'}
                aria-busy={promoState === 'loading'}
              >
                {promoState === 'loading' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : promoState === 'success' ? (
                  <Check className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
                ) : (
                  t('promoCode.apply')
                )}
              </Button>
            </div>
          )}
          {promoState === 'success' && (
            <p className="mt-1.5 text-center text-xs text-green-600" role="status">
              {t('promoCode.success')}
            </p>
          )}
          {promoState === 'error' && promoError && (
            <p className="mt-1.5 text-center text-xs text-destructive" role="alert">
              {promoError}
            </p>
          )}
        </div>

        {/* Legal */}
        <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
          <button
            className="hover:underline disabled:opacity-50 flex items-center gap-1"
            onClick={handleRestore}
            disabled={restoreState === 'loading'}
            aria-busy={restoreState === 'loading'}
          >
            {restoreState === 'loading' && (
              <Loader2 className="h-2.5 w-2.5 animate-spin" aria-hidden="true" />
            )}
            {t('restore')}
          </button>
          <span aria-hidden="true">·</span>
          <button className="hover:underline">{t('terms')}</button>
          <span aria-hidden="true">·</span>
          <button className="hover:underline">{t('privacy')}</button>
        </div>
      </div>
    </div>
  );
}
