'use client';

import { useEffect, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { initAmplitude } from './amplitude';
import { identifyUser } from './amplitude';

interface AmplitudeProviderProps {
  children: ReactNode;
}

export function AmplitudeProvider({ children }: AmplitudeProviderProps) {
  const { data: session } = useSession();

  useEffect(() => {
    initAmplitude();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      identifyUser(session.user.id, {
        email: session.user.email,
        name: session.user.name,
      });
    }
  }, [session]);

  return <>{children}</>;
}
