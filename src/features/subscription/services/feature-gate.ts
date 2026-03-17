import type { SubscriptionTier, SubscriptionStatus, GatedFeature, FeatureAccessResult } from '../types';

/**
 * Feature gating for v3.0 subscription strategy.
 * Books and offline reading are free for all users.
 * Audio (TTS + audiobook) has a daily cap for free users (tracked in store).
 * Pro = data sync + unlimited audio + offline bulk download.
 *
 * Offline semantics (aligned with iOS):
 *   offlineReading  — reading from locally cached chapters while connected (Free)
 *   offlineDownload — one-tap bulk download for offline access (Pro only)
 *
 * Grace Period policy (Web): Pro features remain fully accessible during grace
 * period to give users time to fix their payment. No functionality is blocked —
 * only a UI warning banner is shown. This differs from iOS which restricts access.
 */
export function checkFeatureAccess(
  tier: SubscriptionTier,
  feature: GatedFeature,
  status?: SubscriptionStatus,
): FeatureAccessResult {
  // During grace period, treat as Pro so no features are blocked
  const isGracePeriod = status === 'GRACE_PERIOD';
  const isPro = isGracePeriod || tier === 'PRO' || tier === 'PREMIUM';

  switch (feature) {
    case 'bookAccess':
    case 'offlineReading':
    case 'unlimitedDownloads':
      // Free for all users in v3.0
      // offlineReading = reading from cached chapters (free)
      return { type: 'allowed' };

    case 'offlineDownload':
      // Pro-only: one-tap bulk download for offline access
      return isPro
        ? { type: 'allowed' }
        : { type: 'restricted', feature, message: 'subscription.restricted.offlineDownload' };

    case 'cloudTTS':
    case 'audiobookPlayback':
    case 'unlimitedAudio':
      // Pro = unlimited; free users have a daily cap tracked in subscription store
      return isPro
        ? { type: 'allowed' }
        : { type: 'allowedWithLimit', remaining: 0, limit: 0 };

    case 'dataSync':
      return isPro
        ? { type: 'allowed' }
        : { type: 'restricted', feature, message: 'subscription.restricted.dataSync' };

    case 'cloudBackup':
      return isPro
        ? { type: 'allowed' }
        : { type: 'restricted', feature, message: 'subscription.restricted.cloudBackup' };

    case 'detailedStats':
      return isPro
        ? { type: 'allowed' }
        : { type: 'restricted', feature, message: 'subscription.restricted.detailedStats' };

    case 'premiumTemplates':
      return isPro
        ? { type: 'allowed' }
        : { type: 'allowedWithLimit', remaining: 3, limit: 3 };

    default:
      return { type: 'allowed' };
  }
}
