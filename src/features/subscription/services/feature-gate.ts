import type { SubscriptionTier, GatedFeature, FeatureAccessResult } from '../types';

/**
 * Feature gating for v3.0 subscription strategy.
 * Books and offline reading are free for all users.
 * Audio (TTS + audiobook) has a daily cap for free users (tracked in store).
 * Pro = data sync + unlimited audio.
 */
export function checkFeatureAccess(
  tier: SubscriptionTier,
  feature: GatedFeature,
): FeatureAccessResult {
  const isPro = tier === 'PRO' || tier === 'PREMIUM';

  switch (feature) {
    case 'bookAccess':
    case 'offlineReading':
    case 'unlimitedDownloads':
      // Free for all users in v3.0
      return { type: 'allowed' };

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
