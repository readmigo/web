'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import type { UseTTSReturn, TTSReadingMode } from '../hooks/use-tts';

const PAUSE_BETWEEN_SENTENCES = [
  { value: 0.2, label: '短' },
  { value: 0.3, label: '正常' },
  { value: 0.5, label: '长' },
];

const PAUSE_BETWEEN_PARAGRAPHS = [
  { value: 0.5, label: '短' },
  { value: 0.8, label: '正常' },
  { value: 1.2, label: '长' },
];

const READING_MODES: Array<{ value: TTSReadingMode; label: string; desc: string }> = [
  { value: 'continuous', label: '连续', desc: '朗读全书' },
  { value: 'chapter', label: '章节', desc: '章节末尾停止' },
  { value: 'selection', label: '选中', desc: '仅朗读选中文本' },
];

interface TTSSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tts: UseTTSReturn;
}

export function TTSSettings({ open, onOpenChange, tts }: TTSSettingsProps) {
  const { settings, updateSettings } = tts;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle>朗读设置</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-2">
          {/* Pitch */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">音调</Label>
              <span className="text-sm text-muted-foreground">
                {settings.pitch.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 text-xs text-muted-foreground">低</span>
              <Slider
                value={[settings.pitch]}
                min={0.5}
                max={2.0}
                step={0.1}
                className="flex-1"
                onValueChange={([v]) => updateSettings({ pitch: v })}
              />
              <span className="w-6 text-right text-xs text-muted-foreground">高</span>
            </div>
          </div>

          {/* Pause between sentences */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">句间停顿</Label>
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
            <Label className="text-sm font-medium">段间停顿</Label>
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
            <Label className="text-sm font-medium">行为</Label>
            <div className="space-y-2">
              <label className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                <span className="text-sm">自动翻页</span>
                <input
                  type="checkbox"
                  checked={settings.autoPageTurn}
                  onChange={(e) => updateSettings({ autoPageTurn: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
              </label>
              <label className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                <span className="text-sm">自动滚动</span>
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
            <Label className="text-sm font-medium">朗读模式</Label>
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
