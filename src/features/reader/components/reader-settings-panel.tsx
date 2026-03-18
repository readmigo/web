'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { X, Minus, Plus, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { useReaderStore } from '../stores/reader-store';
import { cn } from '@/lib/utils';
import type { ReaderSettings } from '../types';

interface ReaderSettingsPanelProps {
  onClose: () => void;
}

// ─── Font data ────────────────────────────────────────────────────────────────

type FontValue = ReaderSettings['fontFamily'];

interface FontOption {
  value: FontValue;
  name: string;
  previewText: string;
  previewStyle: string; // inline CSS font-family for the preview element
}

interface FontCategory {
  key: string;
  labelKey: string;
  fonts: FontOption[];
}

const FONT_CATEGORIES: FontCategory[] = [
  {
    key: 'sansSerif',
    labelKey: 'fontCategorySansSerif',
    fonts: [
      {
        value: 'system-ui',
        name: 'System UI',
        previewText: 'The quick brown fox',
        previewStyle: 'system-ui, -apple-system, sans-serif',
      },
      {
        value: 'Inter',
        name: 'Inter',
        previewText: 'The quick brown fox',
        previewStyle: '"Inter", system-ui, sans-serif',
      },
      {
        value: 'Helvetica Neue',
        name: 'Helvetica Neue',
        previewText: 'The quick brown fox',
        previewStyle: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      },
    ],
  },
  {
    key: 'serif',
    labelKey: 'fontCategorySerif',
    fonts: [
      {
        value: 'Georgia',
        name: 'Georgia',
        previewText: 'The quick brown fox',
        previewStyle: 'Georgia, serif',
      },
      {
        value: 'Times New Roman',
        name: 'Times New Roman',
        previewText: 'The quick brown fox',
        previewStyle: '"Times New Roman", Times, serif',
      },
      {
        value: 'Palatino',
        name: 'Palatino',
        previewText: 'The quick brown fox',
        previewStyle: 'Palatino, "Palatino Linotype", serif',
      },
    ],
  },
  {
    key: 'monospace',
    labelKey: 'fontCategoryMonospace',
    fonts: [
      {
        value: 'JetBrains Mono',
        name: 'JetBrains Mono',
        previewText: 'The quick brown fox',
        previewStyle: '"JetBrains Mono", "Courier New", monospace',
      },
      {
        value: 'Consolas',
        name: 'Consolas',
        previewText: 'The quick brown fox',
        previewStyle: 'Consolas, "Courier New", monospace',
      },
      {
        value: 'Courier New',
        name: 'Courier New',
        previewText: 'The quick brown fox',
        previewStyle: '"Courier New", Courier, monospace',
      },
    ],
  },
  {
    key: 'dyslexia',
    labelKey: 'fontCategoryDyslexia',
    fonts: [
      {
        value: 'OpenDyslexic',
        name: 'OpenDyslexic',
        previewText: 'The quick brown fox',
        previewStyle: 'OpenDyslexic, sans-serif',
      },
    ],
  },
  {
    key: 'chinese',
    labelKey: 'fontCategoryChinese',
    fonts: [
      {
        value: 'Noto Serif SC',
        name: 'Noto Serif SC',
        previewText: '春江花月夜',
        previewStyle: '"Noto Serif SC", Georgia, serif',
      },
      {
        value: 'LXGW WenKai',
        name: 'LXGW WenKai',
        previewText: '春江花月夜',
        previewStyle: '"LXGW WenKai", Georgia, serif',
      },
    ],
  },
];

// Google Fonts URL for Inter, JetBrains Mono, Noto Serif SC, LXGW WenKai
const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400&family=Noto+Serif+SC:wght@400&family=LXGW+WenKai&display=swap';

// OpenDyslexic is not on Google Fonts — load from CDN
const OPENDYSLEXIC_URL =
  'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic-regular.min.css';

// ─── Font Picker sub-component ────────────────────────────────────────────────

interface FontPickerProps {
  selected: FontValue;
  onChange: (value: FontValue) => void;
}

function FontPicker({ selected, onChange }: FontPickerProps) {
  const t = useTranslations('settings');
  const fontsInjected = useRef(false);

  // Lazy-load Google Fonts and OpenDyslexic when the picker mounts
  useEffect(() => {
    if (fontsInjected.current) return;
    fontsInjected.current = true;

    const injectLink = (href: string) => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    };

    injectLink(GOOGLE_FONTS_URL);
    injectLink(OPENDYSLEXIC_URL);
  }, []);

  // All categories expanded by default
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FONT_CATEGORIES.map((c) => [c.key, true]))
  );

  const toggleCategory = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-1">
      {FONT_CATEGORIES.map((category) => (
        <div key={category.key}>
          {/* Category header */}
          <button
            type="button"
            onClick={() => toggleCategory(category.key)}
            className="flex w-full items-center justify-between rounded-md px-1 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            aria-expanded={expanded[category.key]}
          >
            <span>{t(category.labelKey as Parameters<typeof t>[0])}</span>
            {expanded[category.key] ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>

          {/* Font option cards */}
          {expanded[category.key] && (
            <div className="grid grid-cols-1 gap-1.5 pb-2">
              {category.fonts.map((font) => {
                const isSelected = selected === font.value;
                return (
                  <button
                    key={font.value}
                    type="button"
                    onClick={() => onChange(font.value)}
                    className={cn(
                      'flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/50 hover:bg-muted/40'
                    )}
                    aria-pressed={isSelected}
                  >
                    {/* Preview text rendered in the target font */}
                    <span
                      className="text-base leading-snug text-foreground"
                      style={{ fontFamily: font.previewStyle }}
                    >
                      {font.previewText}
                    </span>
                    {/* Font name label in system UI */}
                    <span className="text-xs text-muted-foreground">{font.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main settings panel ──────────────────────────────────────────────────────

export function ReaderSettingsPanel({ onClose }: ReaderSettingsPanelProps) {
  const t = useTranslations('settings');
  const tReader = useTranslations('reader');
  const tCommon = useTranslations('common');
  const { settings, updateSettings, resetSettings } = useReaderStore();

  const themes = [
    { value: 'light', label: t('bright'), bg: 'bg-white', text: 'text-black' },
    { value: 'sepia', label: t('sepia'), bg: 'bg-[#f4ecd8]', text: 'text-[#5b4636]' },
    { value: 'dark', label: t('dimmed'), bg: 'bg-[#1a1a1a]', text: 'text-[#e0e0e0]' },
    { value: 'ultraDark', label: t('pureBlack'), bg: 'bg-black', text: 'text-[#e0e0e0]' },
  ] as const;

  const margins = [
    { value: 'small', label: t('narrow') },
    { value: 'medium', label: t('medium') },
    { value: 'large', label: t('wide') },
  ] as const;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 border-l bg-background shadow-lg flex flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <h2 className="font-semibold">{tReader('readingSettings')}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 p-4">
        {/* Font Size */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('fontSize')}</span>
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
            <span className="text-sm font-medium">{t('lineHeight')}</span>
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

        {/* Font Family — enhanced categorized picker */}
        <div className="space-y-3">
          <span className="text-sm font-medium">{t('font')}</span>
          <FontPicker
            selected={settings.fontFamily}
            onChange={(value) => updateSettings({ fontFamily: value })}
          />
        </div>

        <Separator />

        {/* Theme */}
        <div className="space-y-3">
          <span className="text-sm font-medium">{t('theme')}</span>
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
          <span className="text-sm font-medium">{t('margin')}</span>
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

        {/* Appearance Mode */}
        <div className="space-y-3">
          <span className="text-sm font-medium">{t('appearanceMode')}</span>
          <div className="flex gap-2">
            {([
              { value: 'light', label: t('light') },
              { value: 'dark', label: t('dark') },
              { value: 'auto', label: t('followSystem') },
            ] as const).map((mode) => (
              <Button
                key={mode.value}
                variant={settings.appearanceMode === mode.value ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ appearanceMode: mode.value })}
                className="flex-1"
              >
                {mode.label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Text Alignment */}
        <div className="space-y-3">
          <span className="text-sm font-medium">{t('textAlign')}</span>
          <div className="flex gap-2">
            {([
              { value: 'left', label: t('alignLeft') },
              { value: 'center', label: t('alignCenter') },
              { value: 'right', label: t('alignRight') },
              { value: 'justify', label: t('alignJustify') },
            ] as const).map((align) => (
              <Button
                key={align.value}
                variant={settings.textAlign === align.value ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ textAlign: align.value })}
                className="flex-1"
              >
                {align.label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Hyphenation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('hyphenation')}</span>
            <Button
              variant={settings.hyphenation ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => updateSettings({ hyphenation: !settings.hyphenation })}
            >
              {settings.hyphenation ? tCommon('on') : tCommon('off')}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Font Weight */}
        <div className="space-y-3">
          <span className="text-sm font-medium">{t('fontWeight')}</span>
          <div className="flex gap-1">
            {([
              { value: 'light', label: t('weightLight') },
              { value: 'regular', label: t('weightRegular') },
              { value: 'medium', label: t('weightMedium') },
              { value: 'semibold', label: t('weightSemibold') },
              { value: 'bold', label: t('weightBold') },
            ] as const).map((w) => (
              <Button
                key={w.value}
                variant={settings.fontWeight === w.value ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ fontWeight: w.value })}
                className="flex-1 px-1 text-xs"
              >
                {w.label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Column Count */}
        <div className="space-y-3">
          <span className="text-sm font-medium">{t('columnCount')}</span>
          <div className="flex gap-2">
            {([1, 2, 3] as const).map((col) => (
              <Button
                key={col}
                variant={settings.columnCount === col ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ columnCount: col })}
                className="flex-1"
              >
                {t('columnLabel', { count: col })}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Letter Spacing */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('letterSpacing')}</span>
            <span className="text-sm text-muted-foreground">
              {settings.letterSpacing.toFixed(1)}px
            </span>
          </div>
          <Slider
            value={[settings.letterSpacing]}
            min={-2}
            max={5}
            step={0.5}
            onValueChange={([value]) => updateSettings({ letterSpacing: value })}
          />
        </div>

        <Separator />

        {/* Word Spacing */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('wordSpacing')}</span>
            <span className="text-sm text-muted-foreground">
              {settings.wordSpacing}px
            </span>
          </div>
          <Slider
            value={[settings.wordSpacing]}
            min={0}
            max={10}
            step={1}
            onValueChange={([value]) => updateSettings({ wordSpacing: value })}
          />
        </div>

        <Separator />

        {/* Paragraph Spacing */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('paragraphSpacing')}</span>
            <span className="text-sm text-muted-foreground">
              {settings.paragraphSpacing}px
            </span>
          </div>
          <Slider
            value={[settings.paragraphSpacing]}
            min={0}
            max={30}
            step={2}
            onValueChange={([value]) => updateSettings({ paragraphSpacing: value })}
          />
        </div>

        <Separator />

        {/* Text Indent */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('textIndent')}</span>
            <span className="text-sm text-muted-foreground">
              {settings.textIndent.toFixed(1)}em
            </span>
          </div>
          <Slider
            value={[settings.textIndent]}
            min={0}
            max={4}
            step={0.5}
            onValueChange={([value]) => updateSettings({ textIndent: value })}
          />
        </div>

        <Separator />

        {/* Reset */}
        <Button
          variant="outline"
          className="w-full"
          onClick={resetSettings}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          {t('resetDefaults')}
        </Button>
      </div>
    </div>
  );
}
