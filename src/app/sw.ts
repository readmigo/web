/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  RangeRequestsPlugin,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Cache API responses
    {
      matcher: ({ url }) => /^https:\/\/api\.readmigo\.app\/.*$/i.test(url.href),
      handler: new NetworkFirst({
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          }),
        ],
      }),
    },
    // Cache audio files for offline playback
    {
      matcher: ({ url }) => /\.(?:mp3|wav|ogg|m4a)$/i.test(url.pathname),
      handler: new CacheFirst({
        cacheName: "audio-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          }),
          new RangeRequestsPlugin(), // Important for audio streaming
        ],
      }),
    },
    // Cache images
    {
      matcher: ({ url }) => /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i.test(url.pathname),
      handler: new CacheFirst({
        cacheName: "image-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          }),
        ],
      }),
    },
    // Cache EPUB files for offline reading
    {
      matcher: ({ url }) => /\.epub$/i.test(url.pathname),
      handler: new CacheFirst({
        cacheName: "epub-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
          }),
        ],
      }),
    },
    // Cache fonts
    {
      matcher: ({ url }) => /\.(?:woff|woff2|ttf|otf|eot)$/i.test(url.pathname),
      handler: new CacheFirst({
        cacheName: "font-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          }),
        ],
      }),
    },
    // Cache static assets
    {
      matcher: ({ url }) => /\.(?:js|css)$/i.test(url.pathname),
      handler: new StaleWhileRevalidate({
        cacheName: "static-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
          }),
        ],
      }),
    },
    // Cache page navigations
    {
      matcher: ({ url }) => /^https:\/\/.*\.readmigo\.app\/.*$/i.test(url.href),
      handler: new NetworkFirst({
        cacheName: "page-cache",
        networkTimeoutSeconds: 10,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          }),
        ],
      }),
    },
    // Include default cache rules from @serwist/next
    ...defaultCache,
  ],
});

serwist.addEventListeners();
