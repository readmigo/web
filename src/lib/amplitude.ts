import * as amplitude from '@amplitude/analytics-browser';
import { Revenue } from '@amplitude/analytics-browser';

let initialized = false;

export function initAmplitude(): void {
  if (typeof window === 'undefined') return;
  if (initialized) return;

  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  if (!apiKey) {
    console.warn('[Amplitude] NEXT_PUBLIC_AMPLITUDE_API_KEY is not set, skipping init');
    return;
  }

  amplitude.init(apiKey, {
    autocapture: {
      pageViews: true,
      sessions: true,
      formInteractions: true,
    },
    serverZone: 'US',
  });

  initialized = true;
}

export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !initialized) return;
  amplitude.track(name, properties as Record<string, string | number | boolean>);
}

export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !initialized) return;
  amplitude.setUserId(userId);
  if (properties) {
    setUserProperties(properties);
  }
}

export function setUserProperties(properties: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !initialized) return;
  const identifyEvent = new amplitude.Identify();
  Object.entries(properties).forEach(([key, value]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    identifyEvent.set(key, value as any);
  });
  amplitude.identify(identifyEvent);
}

export function resetAmplitude(): void {
  if (typeof window === 'undefined' || !initialized) return;
  amplitude.reset();
}

export function trackRevenue(
  productId: string,
  price: number,
  quantity: number = 1,
  revenueType?: string
): void {
  if (typeof window === 'undefined' || !initialized) return;
  const rev = new Revenue()
    .setProductId(productId)
    .setPrice(price)
    .setQuantity(quantity);
  if (revenueType) {
    rev.setRevenueType(revenueType);
  }
  amplitude.revenue(rev);
}
