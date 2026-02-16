import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Providers } from '@/lib/providers';
import './globals.css';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F8FD' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Readmigo - 在故事中学英语',
    template: '%s | Readmigo',
  },
  description:
    '通过阅读英文原版书籍，在故事中学习语言。Readmigo 结合 AI 技术，为你提供沉浸式的语言学习体验。',
  keywords: ['英语学习', '原版阅读', 'AI', '电子书', '有声书', '语言学习'],
  authors: [{ name: 'Readmigo Team' }],
  creator: 'Readmigo',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Readmigo',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://readmigo.com',
    siteName: 'Readmigo',
    title: 'Readmigo - 在故事中学英语',
    description:
      '通过阅读英文原版书籍，在故事中学习语言。Readmigo 结合 AI 技术，为你提供沉浸式的语言学习体验。',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Readmigo - 在故事中学英语',
    description: '通过阅读英文原版书籍，在故事中学习语言。',
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
