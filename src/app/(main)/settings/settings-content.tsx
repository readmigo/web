'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Globe,
  LogOut,
} from 'lucide-react';
import { OfflineDownloadsCard } from '@/features/offline/components/offline-downloads-card';
import { OfflineSettingsCard } from '@/features/offline/components/offline-settings-card';

export function SettingsContent() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');

  const [currentLocale, setCurrentLocale] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.cookie.match(/NEXT_LOCALE=([\w-]+)/)?.[1] || 'zh';
    }
    return 'zh';
  });

  const handleLocaleChange = (locale: string) => {
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
    setCurrentLocale(locale);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('language')}
          </CardTitle>
          <CardDescription>{t('languageDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {([
              ['zh', t('simplifiedChinese')],
              ['zh-Hant', t('traditionalChinese')],
              ['en', t('english')],
              ['es', t('spanish')],
              ['fr', t('french')],
              ['pt', t('portuguese')],
              ['ja', t('japanese')],
              ['ko', t('korean')],
              ['ar', t('arabic')],
              ['id', t('indonesian')],
              ['ru', t('russian')],
            ] as [string, string][]).map(([locale, label]) => (
              <Button
                key={locale}
                variant={currentLocale === locale ? 'default' : 'outline'}
                onClick={() => handleLocaleChange(locale)}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('account')}
          </CardTitle>
          <CardDescription>{t('accountDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('email')}</p>
              <p className="text-sm text-muted-foreground">user@example.com</p>
            </div>
            <Badge>{t('free')}</Badge>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Button variant="outline" className="justify-start">
              {t('upgrade')}
            </Button>
            <Button variant="outline" className="justify-start text-destructive hover:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t('signOut')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Offline Downloads */}
      <OfflineDownloadsCard />

      {/* Offline Settings */}
      <OfflineSettingsCard />

      {/* Version Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Readmigo Web App v1.0.0</p>
        <p className="mt-1">© 2026 Readmigo. All rights reserved.</p>
      </div>
    </div>
  );
}
