'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 hidden border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:block">
      <div className="container flex h-12 items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Image
            src="/icons/app-icon.png"
            alt="Readmigo"
            width={16}
            height={16}
            className="rounded-sm"
          />
          <span>&copy; {new Date().getFullYear()} Readmigo</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://readmigo.app/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            {t('privacyPolicy')}
          </a>
          <a
            href="https://readmigo.app/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            {t('termsOfService')}
          </a>
          <a
            href="https://readmigo.app"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            {t('website')}
          </a>
        </div>
      </div>
    </footer>
  );
}
