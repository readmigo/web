'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
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
  const { theme, setTheme } = useTheme();
  const { settings: readerSettings, updateSettings: updateReaderSettings } = useReaderStore();
  const { vocabulary, getStats } = useLearningStore();
  const stats = getStats();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);

  const themes = [
    { value: 'light', label: '浅色', icon: Sun },
    { value: 'dark', label: '深色', icon: Moon },
    { value: 'system', label: '跟随系统', icon: Monitor },
  ];

  const readerThemes = [
    { value: 'light', label: '白色', color: 'bg-white border' },
    { value: 'sepia', label: '护眼', color: 'bg-[#f4ecd8]' },
    { value: 'dark', label: '夜间', color: 'bg-[#1a1a1a]' },
  ];

  const fontFamilies: { value: 'serif' | 'sans-serif' | 'monospace'; label: string }[] = [
    { value: 'serif', label: 'Serif' },
    { value: 'sans-serif', label: 'Sans Serif' },
    { value: 'monospace', label: 'Monospace' },
  ];

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            外观
          </CardTitle>
          <CardDescription>自定义应用的外观主题</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>应用主题</Label>
            <div className="flex gap-2">
              {themes.map((t) => (
                <Button
                  key={t.value}
                  variant={theme === t.value ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTheme(t.value)}
                >
                  <t.icon className="mr-2 h-4 w-4" />
                  {t.label}
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
            阅读器设置
          </CardTitle>
          <CardDescription>自定义阅读器的显示效果</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reader Theme */}
          <div className="space-y-2">
            <Label>阅读器主题</Label>
            <div className="flex gap-2">
              {readerThemes.map((t) => (
                <button
                  key={t.value}
                  className={`flex-1 rounded-lg p-4 text-center ${t.color} ${
                    readerSettings.theme === t.value
                      ? 'ring-2 ring-primary ring-offset-2'
                      : ''
                  }`}
                  onClick={() =>
                    updateReaderSettings({ theme: t.value as 'light' | 'sepia' | 'dark' })
                  }
                >
                  <span
                    className={
                      t.value === 'dark' ? 'text-white' : 'text-gray-900'
                    }
                  >
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>字体大小</Label>
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
              <span>小</span>
              <span>大</span>
            </div>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <Label>字体</Label>
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
              <Label>行间距</Label>
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
              <span>紧凑</span>
              <span>宽松</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            音频设置
          </CardTitle>
          <CardDescription>自定义有声书和朗读设置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>自动播放</Label>
              <p className="text-sm text-muted-foreground">
                打开有声书时自动开始播放
              </p>
            </div>
            <Button
              variant={autoPlayAudio ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoPlayAudio(!autoPlayAudio)}
            >
              {autoPlayAudio ? '开启' : '关闭'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知设置
          </CardTitle>
          <CardDescription>管理提醒和通知</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>复习提醒</Label>
              <p className="text-sm text-muted-foreground">
                当有单词需要复习时通知你
              </p>
            </div>
            <Button
              variant={notificationsEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            >
              {notificationsEnabled ? '开启' : '关闭'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            快捷键
          </CardTitle>
          <CardDescription>查看可用的键盘快捷键</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: '← / →', desc: '翻页' },
              { key: 'Space', desc: '下一页' },
              { key: 'F', desc: '专注模式' },
              { key: 'T', desc: '目录' },
              { key: 'A', desc: 'AI 面板' },
              { key: '?', desc: '快捷键帮助' },
              { key: 'Ctrl + D', desc: '添加书签' },
              { key: 'Ctrl + +/-', desc: '调整字体' },
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
            学习数据
          </CardTitle>
          <CardDescription>你的学习进度统计</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalWords}</div>
              <div className="text-sm text-muted-foreground">词汇量</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
              <div className="text-sm text-muted-foreground">复习次数</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold">{stats.streakDays}</div>
              <div className="text-sm text-muted-foreground">连续天数</div>
            </div>
          </div>

          <Separator />

          <Button variant="outline" className="justify-start">
            <Download className="mr-2 h-4 w-4" />
            导出学习数据
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
            语言
          </CardTitle>
          <CardDescription>选择应用语言</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="default" className="flex-1">
              简体中文
            </Button>
            <Button variant="outline" className="flex-1">
              English
            </Button>
            <Button variant="outline" className="flex-1">
              繁體中文
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            账户
          </CardTitle>
          <CardDescription>管理你的账户信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">用户邮箱</p>
              <p className="text-sm text-muted-foreground">user@example.com</p>
            </div>
            <Badge>免费版</Badge>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Button variant="outline" className="justify-start">
              升级到高级版
            </Button>
            <Button variant="outline" className="justify-start text-destructive hover:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
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
