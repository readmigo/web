'use client';

import { useEffect } from 'react';
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
  const { settings, updateSettings, initialize, isInitialized } = useOfflineStore();

  useEffect(() => {
    if (!isInitialized) initialize();
  }, [isInitialized, initialize]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          离线设置
        </CardTitle>
        <CardDescription>配置自动下载和存储偏好</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto Download */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">自动下载</Label>
              <p className="text-xs text-muted-foreground">阅读时自动预下载后续章节</p>
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
                  <Label className="text-sm font-medium">仅 Wi-Fi 下载</Label>
                  <p className="text-xs text-muted-foreground">避免使用移动数据下载</p>
                </div>
                <Checkbox
                  checked={settings.downloadOnWifiOnly}
                  onCheckedChange={(v) => updateSettings({ downloadOnWifiOnly: Boolean(v) })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">预下载章节数</Label>
                  <p className="text-xs text-muted-foreground">提前缓存接下来的章节</p>
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
                        {n} 章
                      </SelectItem>
                    ))}
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
            <Label className="text-sm font-medium">存储上限</Label>
            <p className="text-xs text-muted-foreground">离线内容最大占用空间</p>
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
              <SelectItem value="0">无限制</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto Delete */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">自动删除</Label>
            <p className="text-xs text-muted-foreground">超出时限后自动删除离线内容</p>
          </div>
          <Select
            value={String(settings.autoDeleteAfterDays)}
            onValueChange={(v) => updateSettings({ autoDeleteAfterDays: Number(v) })}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">永不</SelectItem>
              <SelectItem value="7">7 天</SelectItem>
              <SelectItem value="14">14 天</SelectItem>
              <SelectItem value="30">30 天</SelectItem>
              <SelectItem value="60">60 天</SelectItem>
              <SelectItem value="90">90 天</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
