'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogIn, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface LoginPromptProps {
  feature?: string;
  onDismiss: () => void;
}

/**
 * Modal prompt shown when a guest user tries to access a feature that requires login.
 * Aligned with iOS LoginPromptView.
 */
export function LoginPrompt({ feature, onDismiss }: LoginPromptProps) {
  const router = useRouter();
  const t = useTranslations('auth');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-background p-6 animate-in zoom-in-95 duration-200">
        <button
          className="absolute right-3 top-3 rounded-full p-1 hover:bg-muted"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">{t('loginRequired')}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('loginPromptDesc')}
          </p>
        </div>

        <div className="mt-6 space-y-2">
          <Button
            className="w-full"
            onClick={() => {
              onDismiss();
              router.push('/login');
            }}
          >
            {t('loginNow')}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onDismiss}>
            {t('continueBrowsing')}
          </Button>
        </div>
      </div>
    </div>
  );
}
