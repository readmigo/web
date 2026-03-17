export type SubscriptionTier = 'FREE' | 'PRO' | 'PREMIUM';

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'GRACE_PERIOD' | 'TRIALING';

export interface SubscriptionState {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  isActive: boolean;
  startedAt?: string;
  expiresAt?: string;
  trialEnd?: string;
  willRenew: boolean;
  originalTransactionId?: string;
  productId?: string;
}

export type SubscriptionPeriod = 'weekly' | 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: SubscriptionPeriod;
  priceDisplay: string;
  pricePerMonth?: string;
  savings?: string;
  hasTrial: boolean;
  trialDays?: number;
  isBestValue?: boolean;
}

export type GatedFeature =
  | 'bookAccess'
  | 'offlineReading'
  | 'offlineDownload'
  | 'premiumTemplates'
  | 'detailedStats'
  | 'cloudTTS'
  | 'audiobookPlayback'
  | 'unlimitedDownloads'
  | 'dataSync'
  | 'cloudBackup'
  | 'unlimitedAudio';

export type PaywallTrigger =
  | 'general'
  | 'audioLimitReached'
  | 'syncRequired'
  | 'downloadRequired'
  | 'dataBackup';

export type FeatureAccessResult =
  | { type: 'allowed' }
  | { type: 'allowedWithLimit'; remaining: number; limit: number }
  | { type: 'restricted'; feature: GatedFeature; message: string };
