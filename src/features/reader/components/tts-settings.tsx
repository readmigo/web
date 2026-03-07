'use client';

import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import type { UseTTSReturn, TTSReadingMode } from '../hooks/use-tts';

const PAUSE_BETWEEN_SENTENCES_VALUES = [0.2, 0.3, 0.5] as const;
const PAUSE_BETWEEN_PARAGRAPHS_VALUES = [0.5, 0.8, 1.2] as const;

interface TTSSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tts: UseTTSReturn;
}

export function TTSSettings({ open, onOpenChange, tts }: TTSSettingsProps) {
  const t = useTranslations('settings');
  const tReader = useTranslations('reader');
  const { settings, updateSettings } = tts;

  const READING_MODES: Array<{ value: TTSReadingMode; label: string; desc: string }> = [
    { value: 'continuous', label: tReader('readingModeContinuous'), desc: tReader('readingModeContinuousDesc') },
    { value: 'chapter', label: tReader('readingModeChapter'), desc: tReader('readingModeChapterDesc') },
    { value: 'selection', label: tReader('readingModeSelection'), desc: tReader('readingModeSelectionDesc') },
  ];

  const PAUSE_BETWEEN_SENTENCES = [
    { value: PAUSE_BETWEEN_SENTENCES_VALUES[0], label: t('short') },
    { value: PAUSE_BETWEEN_SENTENCES_VALUES[1], label: t('normal') },
    { value: PAUSE_BETWEEN_SENTENCES_VALUES[2], label: t('long') },
  ];

  const PAUSE_BETWEEN_PARAGRAPHS = [
    { value: PAUSE_BETWEEN_PARAGRAPHS_VALUES[0], label: t('short') },
    { value: PAUSE_BETWEEN_PARAGRAPHS_VALUES[1], label: t('normal') },
    { value: PAUSE_BETWEEN_PARAGRAPHS_VALUES[2], label: t('long') },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle>{tReader('ttsSettings')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-2">
          {/* Pitch */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{t('pitch')}</Label>
              <span className="text-sm text-muted-foreground">
                {settings.pitch.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 text-xs text-muted-foreground">{t('low')}</span>
              <Slider
                value={[settings.pitch]}
                min={0.5}
                max={2.0}
                step={0.1}
                className="flex-1"
                onValueChange={([v]) => updateSettings({ pitch: v })}
              />
              <span className="w-6 text-right text-xs text-muted-foreground">{t('high')}</span>
            </div>
          </div>

          {/* Pause between sentences */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('sentencePause')}</Label>
            <div className="flex gap-2">
              {PAUSE_BETWEEN_SENTENCES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateSettings({ pauseBetweenSentences: value })}
                  className={`flex-1 rounded-lg py-2 text-sm transition-colors ${
                    Math.abs(settings.pauseBetweenSentences - value) < 0.05
                      ? 'bg-primary/15 font-semibold text-primary'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Pause between paragraphs */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('paragraphPause')}</Label>
            <div className="flex gap-2">
              {PAUSE_BETWEEN_PARAGRAPHS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateSettings({ pauseBetweenParagraphs: value })}
                  className={`flex-1 rounded-lg py-2 text-sm transition-colors ${
                    Math.abs(settings.pauseBetweenParagraphs - value) < 0.05
                      ? 'bg-primary/15 font-semibold text-primary'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Auto scroll & page turn */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('behavior')}</Label>
            <div className="space-y-2">
              <label className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                <span className="text-sm">{t('autoPageTurn')}</span>
                <input
                  type="checkbox"
                  checked={settings.autoPageTurn}
                  onChange={(e) => updateSettings({ autoPageTurn: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
              </label>
              <label className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                <span className="text-sm">{t('autoScroll')}</span>
                <input
                  type="checkbox"
                  checked={settings.autoScroll}
                  onChange={(e) => updateSettings({ autoScroll: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
              </label>
            </div>
          </div>

          {/* Reading mode */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('readingMode')}</Label>
            <div className="space-y-1">
              {READING_MODES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => updateSettings({ readingMode: value })}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${
                    settings.readingMode === value
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted/50 text-foreground hover:bg-muted/80'
                  }`}
                >
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
