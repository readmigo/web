declare module 'next-pwa' {
  import { NextConfig } from 'next';

  interface RuntimeCachingRule {
    urlPattern: RegExp | string;
    handler: 'CacheFirst' | 'CacheOnly' | 'NetworkFirst' | 'NetworkOnly' | 'StaleWhileRevalidate';
    options?: {
      cacheName?: string;
      expiration?: {
        maxEntries?: number;
        maxAgeSeconds?: number;
      };
      networkTimeoutSeconds?: number;
      rangeRequests?: boolean;
      cacheableResponse?: {
        statuses?: number[];
        headers?: { [key: string]: string };
      };
    };
  }

  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    scope?: string;
    sw?: string;
    skipWaiting?: boolean;
    runtimeCaching?: RuntimeCachingRule[];
    publicExcludes?: string[];
    buildExcludes?: (RegExp | string)[];
    fallbacks?: {
      document?: string;
      image?: string;
      audio?: string;
      video?: string;
      font?: string;
    };
    cacheOnFrontEndNav?: boolean;
    reloadOnOnline?: boolean;
    customWorkerDir?: string;
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;

  export = withPWA;
}
