'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, useSession } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { setTokens } from './api/client';
import { GlobalAudioPlayer } from '@/features/audiobook/components/global-audio-player';

interface ProvidersProps {
  children: ReactNode;
}

// Syncs NextAuth session tokens to API client
function AuthSync({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      setTokens(session.accessToken || null, session.refreshToken || null);
    } else if (status === 'unauthenticated') {
      setTokens(null, null);
    }
  }, [session, status]);

  return <>{children}</>;
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
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthSync>
            {children}
            <GlobalAudioPlayer />
          </AuthSync>
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
