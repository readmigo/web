'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { GlobalAudioPlayer } from '@/features/audiobook/components/global-audio-player';
import { PostHogProvider, PostHogIdentify } from '@/lib/posthog';
interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <PostHogProvider>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <PostHogIdentify />
            <GlobalAudioPlayer />
            <Toaster position="top-center" richColors />
          </ThemeProvider>
        </QueryClientProvider>
      </SessionProvider>
    </PostHogProvider>
  );
}
