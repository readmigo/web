import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/lib/providers';
import './globals.css';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
