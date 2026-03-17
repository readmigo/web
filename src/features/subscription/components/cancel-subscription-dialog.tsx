'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Cloud, ShieldCheck, Headphones, BarChart3, Palette, AlertTriangle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export type CancelReason =
  | 'too_expensive'
  | 'not_enough_content'
  | 'found_alternative'
  | 'technical_issues'
  | 'not_using_enough'
  | 'other';

const CANCEL_REASONS: CancelReason[] = [
  'too_expensive',
  'not_enough_content',
  'found_alternative',
  'technical_issues',
  'not_using_enough',
  'other',
];

const PRO_FEATURES = [
  { icon: Cloud, labelKey: 'cancelDialog.features.dataSync' },
  { icon: ShieldCheck, labelKey: 'cancelDialog.features.cloudBackup' },
  { icon: Headphones, labelKey: 'cancelDialog.features.unlimitedAudio' },
  { icon: BarChart3, labelKey: 'cancelDialog.features.stats' },
  { icon: Palette, labelKey: 'cancelDialog.features.templates' },
] as const;

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelSubscriptionDialog({ open, onOpenChange }: CancelSubscriptionDialogProps) {
  const t = useTranslations('subscription');
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedReason, setSelectedReason] = useState<CancelReason | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        // Reset state when closing
        setStep(1);
        setSelectedReason(null);
        setErrorMessage(null);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  // Mutation: cancel via Stripe portal redirect
  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ url: string }>('/subscriptions/portal');
      return res.url;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: () => {
      setErrorMessage(t('cancelDialog.error'));
    },
  });

  // Mutation: direct cancel (non-Stripe / IAP)
  const cancelMutation = useMutation({
    mutationFn: async (reason: CancelReason) => {
      await apiClient.post('/subscriptions/cancel', { reason });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subscription', 'status'] });
      handleOpenChange(false);
    },
    onError: () => {
      setErrorMessage(t('cancelDialog.error'));
    },
  });

  const isSubmitting = portalMutation.isPending || cancelMutation.isPending;

  const handleConfirmCancel = useCallback(() => {
    if (!selectedReason) return;
    setErrorMessage(null);

    // Try Stripe portal first; fall back to direct cancel on error
    portalMutation.mutate(undefined, {
      onError: () => {
        cancelMutation.mutate(selectedReason);
      },
    });
  }, [selectedReason, portalMutation, cancelMutation]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">
                {t('cancelDialog.step1Title')}
              </DialogTitle>
              <DialogDescription>
                {t('cancelDialog.loseAccess')}
              </DialogDescription>
            </DialogHeader>

            <ul className="flex flex-col gap-2 py-1" role="list">
              {PRO_FEATURES.map(({ icon: Icon, labelKey }) => (
                <li
                  key={labelKey}
                  className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 dark:border-orange-800 dark:bg-orange-950/30"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-orange-500" aria-hidden="true" />
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm">{t(labelKey)}</span>
                </li>
              ))}
            </ul>

            <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col">
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white border-0"
                onClick={() => handleOpenChange(false)}
              >
                {t('cancelDialog.keepPro')}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-destructive"
                onClick={() => setStep(2)}
              >
                {t('cancelDialog.continueCancelling')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">
                {t('cancelDialog.step2Title')}
              </DialogTitle>
              <DialogDescription>
                {t('cancelDialog.step2Desc')}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2 py-1" role="radiogroup" aria-label={t('cancelDialog.step2Title')}>
              {CANCEL_REASONS.map((reason) => (
                <button
                  key={reason}
                  role="radio"
                  aria-checked={selectedReason === reason}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                    selectedReason === reason
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border hover:border-muted-foreground/40 text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => {
                    setSelectedReason(reason);
                    setErrorMessage(null);
                  }}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                      selectedReason === reason ? 'border-primary' : 'border-muted-foreground/40',
                    )}
                    aria-hidden="true"
                  >
                    {selectedReason === reason && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </span>
                  {t(`cancelDialog.reasons.${reason}`)}
                </button>
              ))}
            </div>

            {errorMessage && (
              <p className="flex items-center gap-1.5 text-xs text-destructive" role="alert">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {errorMessage}
              </p>
            )}

            <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col">
              <Button
                variant="destructive"
                className="w-full"
                disabled={!selectedReason || isSubmitting}
                onClick={handleConfirmCancel}
              >
                {isSubmitting ? (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4 animate-pulse" aria-hidden="true" />
                    {t('cancelDialog.cancelling')}
                  </>
                ) : (
                  t('cancelDialog.confirm')
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                disabled={isSubmitting}
                onClick={() => setStep(1)}
              >
                {t('cancelDialog.back')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
