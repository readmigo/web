'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings2 } from 'lucide-react';
import { useOfflineStore } from '../stores/offline-store';

export function OfflineSettingsCard() {
  const t = useTranslations('offline');
  const { settings, updateSettings, initialize, isInitialized } = useOfflineStore();

  useEffect(() => {
    if (!isInitialized) initialize();
  }, [isInitialized, initialize]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          {t('settingsTitle')}
        </CardTitle>
        <CardDescription>{t('settingsDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto Download */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('autoDownload')}</Label>
              <p className="text-xs text-muted-foreground">{t('autoDownloadDesc')}</p>
            </div>
            <Checkbox
              checked={settings.autoDownloadEnabled}
              onCheckedChange={(v) => updateSettings({ autoDownloadEnabled: Boolean(v) })}
            />
          </div>

          {settings.autoDownloadEnabled && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">{t('wifiOnly')}</Label>
                  <p className="text-xs text-muted-foreground">{t('wifiOnlyDesc')}</p>
                </div>
                <Checkbox
                  checked={settings.downloadOnWifiOnly}
                  onCheckedChange={(v) => updateSettings({ downloadOnWifiOnly: Boolean(v) })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">{t('predownloadChapters')}</Label>
                  <p className="text-xs text-muted-foreground">{t('predownloadDesc')}</p>
                </div>
                <Select
                  value={String(settings.predownloadNextChapters)}
                  onValueChange={(v) => updateSettings({ predownloadNextChapters: Number(v) })}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 5, 10].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {t('chaptersCount', { count: n })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* G14: Download Quality */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">{t('downloadQuality')}</Label>
                  <p className="text-xs text-muted-foreground">{t('downloadQualityDesc')}</p>
                </div>
                <Select
                  value={settings.downloadQuality}
                  onValueChange={(v) => updateSettings({ downloadQuality: v as 'low' | 'medium' | 'high' })}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('qualityLow')}</SelectItem>
                    <SelectItem value="medium">{t('qualityMedium')}</SelectItem>
                    <SelectItem value="high">{t('qualityHigh')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <div className="border-t" />

        {/* Storage Limit */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">{t('storageLimit')}</Label>
            <p className="text-xs text-muted-foreground">{t('storageLimitDesc')}</p>
          </div>
          <Select
            value={String(settings.maxStorageMB)}
            onValueChange={(v) => updateSettings({ maxStorageMB: Number(v) })}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="500">500 MB</SelectItem>
              <SelectItem value="1000">1 GB</SelectItem>
              <SelectItem value="2000">2 GB</SelectItem>
              <SelectItem value="5000">5 GB</SelectItem>
              <SelectItem value="0">{t('unlimited')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto Delete */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">{t('autoDelete')}</Label>
            <p className="text-xs text-muted-foreground">{t('autoDeleteDesc')}</p>
          </div>
          <Select
            value={String(settings.autoDeleteAfterDays)}
            onValueChange={(v) => updateSettings({ autoDeleteAfterDays: Number(v) })}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t('neverDelete')}</SelectItem>
              {[7, 14, 30, 60, 90].map((n) => (
                <SelectItem key={n} value={String(n)}>{t('daysCount', { count: n })}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
