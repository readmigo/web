'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { X, Minus, Plus, RotateCcw } from 'lucide-react';
import { useReaderStore } from '../stores/reader-store';
import { cn } from '@/lib/utils';

interface ReaderSettingsPanelProps {
  onClose: () => void;
}

export function ReaderSettingsPanel({ onClose }: ReaderSettingsPanelProps) {
  const { settings, updateSettings, resetSettings } = useReaderStore();

  const fontFamilies = [
    { value: 'serif', label: '衬线' },
    { value: 'sans-serif', label: '无衬线' },
    { value: 'monospace', label: '等宽' },
  ] as const;

  const themes = [
    { value: 'light', label: '亮色', bg: 'bg-white', text: 'text-black' },
    { value: 'sepia', label: '护眼', bg: 'bg-[#f4ecd8]', text: 'text-[#5b4636]' },
    { value: 'dark', label: '暗色', bg: 'bg-[#1a1a1a]', text: 'text-[#e0e0e0]' },
  ] as const;

  const margins = [
    { value: 'small', label: '窄' },
    { value: 'medium', label: '中' },
    { value: 'large', label: '宽' },
  ] as const;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 border-l bg-background shadow-lg">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h2 className="font-semibold">阅读设置</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-6 p-4">
        {/* Font Size */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">字体大小</span>
            <span className="text-sm text-muted-foreground">
              {settings.fontSize}px
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                updateSettings({ fontSize: Math.max(12, settings.fontSize - 2) })
              }
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Slider
              value={[settings.fontSize]}
              min={12}
              max={32}
              step={2}
              onValueChange={([value]) => updateSettings({ fontSize: value })}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                updateSettings({ fontSize: Math.min(32, settings.fontSize + 2) })
              }
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Line Height */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">行距</span>
            <span className="text-sm text-muted-foreground">
              {settings.lineHeight.toFixed(1)}
            </span>
          </div>
          <Slider
            value={[settings.lineHeight]}
            min={1.2}
            max={2.4}
            step={0.2}
            onValueChange={([value]) => updateSettings({ lineHeight: value })}
          />
        </div>

        <Separator />

        {/* Font Family */}
        <div className="space-y-3">
          <span className="text-sm font-medium">字体</span>
          <div className="flex gap-2">
            {fontFamilies.map((font) => (
              <Button
                key={font.value}
                variant={settings.fontFamily === font.value ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ fontFamily: font.value })}
                className="flex-1"
              >
                {font.label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Theme */}
        <div className="space-y-3">
          <span className="text-sm font-medium">主题</span>
          <div className="flex gap-2">
            {themes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => updateSettings({ theme: theme.value })}
                className={cn(
                  'flex h-12 flex-1 items-center justify-center rounded-lg border-2',
                  theme.bg,
                  theme.text,
                  settings.theme === theme.value
                    ? 'border-primary'
                    : 'border-transparent'
                )}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Margin */}
        <div className="space-y-3">
          <span className="text-sm font-medium">边距</span>
          <div className="flex gap-2">
            {margins.map((margin) => (
              <Button
                key={margin.value}
                variant={settings.marginSize === margin.value ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ marginSize: margin.value })}
                className="flex-1"
              >
                {margin.label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Reset */}
        <Button
          variant="outline"
          className="w-full"
          onClick={resetSettings}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          重置默认设置
        </Button>
      </div>
    </div>
  );
}
