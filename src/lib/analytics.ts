import posthog from 'posthog-js';
import { amplitude } from './amplitude';

type Properties = Record<string, unknown>;

export function trackEvent(event: string, properties?: Properties) {
  try {
    posthog.capture(event, properties);
  } catch {}

  try {
    amplitude.track(event, properties);
  } catch {}
}

export function identifyUser(userId: string, properties?: Properties) {
  try {
    posthog.identify(userId, properties);
  } catch {}

  try {
    const identifyEvent = new amplitude.Identify();
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        identifyEvent.set(key, value as amplitude.Types.ValidPropertyType);
      }
    }
    amplitude.identify(identifyEvent, { user_id: userId });
  } catch {}
}

export function resetAnalytics() {
  try {
    posthog.reset();
  } catch {}

  try {
    amplitude.reset();
  } catch {}
}
