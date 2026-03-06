import type { SubscriptionTier, GatedFeature, FeatureAccessResult } from '../types';

/**
 * Feature gating aligned with iOS FeatureGateService.
 * Checks whether a user with a given tier can access a feature.
 */
export function checkFeatureAccess(
  tier: SubscriptionTier,
  feature: GatedFeature,
): FeatureAccessResult {
  const isPro = tier === 'PRO' || tier === 'PREMIUM';

  switch (feature) {
    case 'bookAccess':
      // Pro users can access all books; free users only free books
      // (actual book-level check happens at call site with isFree param)
      return isPro
        ? { type: 'allowed' }
        : { type: 'restricted', feature, message: '升级 Pro 解锁全部书籍' };

    case 'offlineReading':
      return isPro
        ? { type: 'allowed' }
        : { type: 'restricted', feature, message: '升级 Pro 开启离线阅读' };

    case 'cloudTTS':
      return isPro
        ? { type: 'allowed' }
        : { type: 'restricted', feature, message: '升级 Pro 使用云端语音' };

    case 'detailedStats':
      return isPro
        ? { type: 'allowed' }
        : { type: 'restricted', feature, message: '升级 Pro 查看详细统计' };

    case 'audiobookPlayback':
      // Free users get 5-min trial per audiobook
      return isPro
        ? { type: 'allowed' }
        : { type: 'allowedWithLimit', remaining: 300, limit: 300 };

    case 'audiobookChapters':
      // Free users only get chapter 0
      return isPro
        ? { type: 'allowed' }
        : { type: 'allowedWithLimit', remaining: 1, limit: 1 };

    case 'premiumTemplates':
      return isPro
        ? { type: 'allowed' }
        : { type: 'allowedWithLimit', remaining: 3, limit: 3 };

    case 'unlimitedDownloads':
      return isPro
        ? { type: 'allowed' }
        : { type: 'restricted', feature, message: '升级 Pro 无限下载' };

    default:
      return { type: 'allowed' };
  }
}
