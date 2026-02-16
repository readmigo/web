'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Sun,
  Moon,
  Monitor,
  BookOpen,
  Bell,
  Download,
  User,
  Globe,
  Keyboard,
  Volume2,
  Eye,
  Database,
  LogOut,
} from 'lucide-react';
import { useReaderStore } from '@/features/reader/stores/reader-store';
import { useLearningStore } from '@/features/learning/stores/learning-store';
import { OfflineStorageCard } from '@/features/offline';

export function SettingsContent() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const { theme, setTheme } = useTheme();
  const { settings: readerSettings, updateSettings: updateReaderSettings } = useReaderStore();
  const { vocabulary, getStats } = useLearningStore();
  const stats = getStats();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [currentLocale, setCurrentLocale] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.cookie.match(/NEXT_LOCALE=(\w+)/)?.[1] || 'zh';
    }
    return 'zh';
  });

  const themes = [
    { value: 'light', label: t('light'), icon: Sun },
    { value: 'dark', label: t('dark'), icon: Moon },
    { value: 'system', label: t('system'), icon: Monitor },
  ];

  const readerThemes = [
    { value: 'light', label: t('white'), color: 'bg-white border' },
    { value: 'sepia', label: t('sepia'), color: 'bg-[#f4ecd8]' },
    { value: 'dark', label: t('night'), color: 'bg-[#1a1a1a]' },
  ];

  const fontFamilies: { value: 'serif' | 'sans-serif' | 'monospace'; label: string }[] = [
    { value: 'serif', label: 'Serif' },
    { value: 'sans-serif', label: 'Sans Serif' },
    { value: 'monospace', label: 'Monospace' },
  ];

  const handleLocaleChange = (locale: string) => {
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
    setCurrentLocale(locale);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {t('appearance')}
          </CardTitle>
          <CardDescription>{t('appearanceDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t('appTheme')}</Label>
            <div className="flex gap-2">
              {themes.map((themeOption) => (
                <Button
                  key={themeOption.value}
                  variant={theme === themeOption.value ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTheme(themeOption.value)}
                >
                  <themeOption.icon className="mr-2 h-4 w-4" />
                  {themeOption.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reader Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('readerSettings')}
          </CardTitle>
          <CardDescription>{t('readerSettingsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reader Theme */}
          <div className="space-y-2">
            <Label>{t('readerTheme')}</Label>
            <div className="flex gap-2">
              {readerThemes.map((rt) => (
                <button
                  key={rt.value}
                  className={`flex-1 rounded-lg p-4 text-center ${rt.color} ${
                    readerSettings.theme === rt.value
                      ? 'ring-2 ring-primary ring-offset-2'
                      : ''
                  }`}
                  onClick={() =>
                    updateReaderSettings({ theme: rt.value as 'light' | 'sepia' | 'dark' })
                  }
                >
                  <span
                    className={
                      rt.value === 'dark' ? 'text-white' : 'text-gray-900'
                    }
                  >
                    {rt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{t('fontSize')}</Label>
              <span className="text-sm text-muted-foreground">
                {readerSettings.fontSize}px
              </span>
            </div>
            <Slider
              value={[readerSettings.fontSize]}
              min={12}
              max={32}
              step={1}
              onValueChange={([value]) => updateReaderSettings({ fontSize: value })}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('small')}</span>
              <span>{t('large')}</span>
            </div>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <Label>{t('font')}</Label>
            <div className="flex gap-2">
              {fontFamilies.map((f) => (
                <Button
                  key={f.value}
                  variant={readerSettings.fontFamily === f.value ? 'default' : 'outline'}
                  className="flex-1"
                  style={{ fontFamily: f.value }}
                  onClick={() => updateReaderSettings({ fontFamily: f.value })}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Line Height */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{t('lineHeight')}</Label>
              <span className="text-sm text-muted-foreground">
                {readerSettings.lineHeight}
              </span>
            </div>
            <Slider
              value={[readerSettings.lineHeight]}
              min={1.2}
              max={2.5}
              step={0.1}
              onValueChange={([value]) => updateReaderSettings({ lineHeight: value })}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('compact')}</span>
              <span>{t('loose')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            {t('audioSettings')}
          </CardTitle>
          <CardDescription>{t('audioSettingsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('autoPlay')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('autoPlayDesc')}
              </p>
            </div>
            <Button
              variant={autoPlayAudio ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoPlayAudio(!autoPlayAudio)}
            >
              {autoPlayAudio ? tc('on') : tc('off')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('notifications')}
          </CardTitle>
          <CardDescription>{t('notificationsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('reviewReminder')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('reviewReminderDesc')}
              </p>
            </div>
            <Button
              variant={notificationsEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            >
              {notificationsEnabled ? tc('on') : tc('off')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            {t('shortcuts')}
          </CardTitle>
          <CardDescription>{t('shortcutsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: '← / →', desc: t('turnPage') },
              { key: 'Space', desc: t('nextPage') },
              { key: 'F', desc: t('focusMode') },
              { key: 'T', desc: t('toc') },
              { key: 'A', desc: t('aiPanel') },
              { key: '?', desc: t('shortcutsHelp') },
              { key: 'Ctrl + D', desc: t('addBookmark') },
              { key: 'Ctrl + +/-', desc: t('adjustFont') },
            ].map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between rounded-lg border p-2"
              >
                <span className="text-sm">{shortcut.desc}</span>
                <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t('learningData')}
          </CardTitle>
          <CardDescription>{t('learningDataDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalWords}</div>
              <div className="text-sm text-muted-foreground">{t('vocabulary')}</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
              <div className="text-sm text-muted-foreground">{t('reviews')}</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold">{stats.streakDays}</div>
              <div className="text-sm text-muted-foreground">{t('streakDays')}</div>
            </div>
          </div>

          <Separator />

          <Button variant="outline" className="justify-start">
            <Download className="mr-2 h-4 w-4" />
            {t('exportData')}
          </Button>
        </CardContent>
      </Card>

      {/* Offline Storage */}
      <OfflineStorageCard />

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
        <p className="mt-1">© 2024 Readmigo. All rights reserved.</p>
      </div>
    </div>
  );
}
