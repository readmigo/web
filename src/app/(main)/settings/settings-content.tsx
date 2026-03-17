'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  User,
  Globe,
  LogOut,
  Crown,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { OfflineDownloadsCard } from '@/features/offline/components/offline-downloads-card';
import { OfflineSettingsCard } from '@/features/offline/components/offline-settings-card';
import { ProfileEditSection } from './profile-edit-section';
import { apiClient } from '@/lib/api/client';
import { useSubscription } from '@/features/subscription/hooks/use-subscription';
import { clearUserData } from '@/lib/auth/clear-user-data';

export function SettingsContent() {
  const t = useTranslations('settings');
  const ts = useTranslations('subscription');
  const { isPro, isLoading: subLoading } = useSubscription();

  const [currentLocale, setCurrentLocale] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.cookie.match(/NEXT_LOCALE=([\w-]+)/)?.[1] || 'zh';
    }
    return 'zh';
  });

  // D7: Delete account dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLocaleChange = (locale: string) => {
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
    setCurrentLocale(locale);

    // G8: Sync locale to server (fire-and-forget)
    apiClient.patch('/users/me', { locale }).catch(() => {/* silent */});

    // G8: Analytics event
    try {
      // posthog may not be available in all environments — access via window to avoid import issues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ph = (window as any).posthog;
      if (ph?.capture) {
        ph.capture('language_changed', { from: currentLocale, to: locale });
      }
    } catch {/* silent */}

    window.location.reload();
  };

  // D7: Delete account handler
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await apiClient.delete('/users/me');
      clearUserData();
      window.location.href = '/api/auth/signout?callbackUrl=/login';
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Edit — G7 */}
      <ProfileEditSection />

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

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-500" aria-hidden="true" />
            {ts('page.heading')}
          </CardTitle>
          <CardDescription>{ts('page.subheading')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/settings/subscription"
            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
            aria-label={ts('page.manageSubscription')}
          >
            <div className="flex items-center gap-3">
              {!subLoading && (
                isPro ? (
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0">
                    <Crown className="mr-1 h-3 w-3" aria-hidden="true" />
                    Pro
                  </Badge>
                ) : (
                  <Badge variant="secondary">Free</Badge>
                )
              )}
              <span className="text-sm font-medium">{ts('page.manageSubscription')}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </Link>
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

          {/* D7: Delete Account */}
          <Separator />

          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
            onClick={() => {
              setDeleteConfirmText('');
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('deleteAccount')}
          </Button>
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

      {/* D7: Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              {t('deleteAccountTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">{t('deleteAccountDesc')}</span>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={t('deleteAccountConfirmPlaceholder')}
                className="mt-2 font-mono"
                aria-label={t('deleteAccountConfirmPlaceholder')}
                autoComplete="off"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('deleteAccountCancelBtn')}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== 'DELETE' || isDeleting}
              onClick={handleDeleteAccount}
            >
              {isDeleting ? '...' : t('deleteAccountConfirmBtn')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
