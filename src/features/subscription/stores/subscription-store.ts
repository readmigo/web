import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SubscriptionTier, SubscriptionStatus, SubscriptionState } from '../types';

export const FREE_DAILY_AUDIO_LIMIT_SECONDS = 30 * 60;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface SubscriptionStoreState {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  isActive: boolean;
  expiresAt?: string;
  trialEnd?: string;
  willRenew: boolean;
  isLoading: boolean;
  dailyAudioSeconds: number;
  dailyAudioDate: string;

  setSubscription: (state: SubscriptionState) => void;
  setLoading: (loading: boolean) => void;
  setDailyAudioUsage: (seconds: number, date: string) => void;
  resetDailyAudioUsage: () => void;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionStoreState>()(
  persist(
    (set) => ({
      tier: 'FREE',
      status: 'EXPIRED',
      isActive: false,
      expiresAt: undefined,
      willRenew: false,
      isLoading: false,
      dailyAudioSeconds: 0,
      dailyAudioDate: todayISO(),

      setSubscription: (state) =>
        set({
          tier: state.tier,
          status: state.status,
          isActive: state.isActive,
          expiresAt: state.expiresAt,
          trialEnd: state.trialEnd,
          willRenew: state.willRenew,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setDailyAudioUsage: (seconds, date) =>
        set({ dailyAudioSeconds: seconds, dailyAudioDate: date }),

      resetDailyAudioUsage: () =>
        set({ dailyAudioSeconds: 0, dailyAudioDate: todayISO() }),

      reset: () =>
        set({
          tier: 'FREE',
          status: 'EXPIRED',
          isActive: false,
          expiresAt: undefined,
          trialEnd: undefined,
          willRenew: false,
          dailyAudioSeconds: 0,
          dailyAudioDate: todayISO(),
        }),
    }),
    {
      name: 'readmigo_subscription',
      partialize: (state) => ({
        tier: state.tier,
        status: state.status,
        isActive: state.isActive,
        expiresAt: state.expiresAt,
        trialEnd: state.trialEnd,
        willRenew: state.willRenew,
        dailyAudioSeconds: state.dailyAudioSeconds,
        dailyAudioDate: state.dailyAudioDate,
      }),
    },
  ),
);
