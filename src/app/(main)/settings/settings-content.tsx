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

export function SettingsContent() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');

  const [currentLocale, setCurrentLocale] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.cookie.match(/NEXT_LOCALE=(\w+)/)?.[1] || 'zh';
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
          <div className="flex gap-2">
            <Button
              variant={currentLocale === 'zh' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handleLocaleChange('zh')}
            >
              {t('simplifiedChinese')}
            </Button>
            <Button
              variant={currentLocale === 'en' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handleLocaleChange('en')}
            >
              {t('english')}
            </Button>
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

      {/* Version Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Readmigo Web App v1.0.0</p>
        <p className="mt-1">© 2026 Readmigo. All rights reserved.</p>
      </div>
    </div>
  );
}
