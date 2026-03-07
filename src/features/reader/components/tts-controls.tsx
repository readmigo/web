'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  SkipForward,
  Moon,
  PersonStanding,
  Settings,
  Volume2,
  Loader2,
} from 'lucide-react';
import type { UseTTSReturn, SleepTimerOptionValue } from '../hooks/use-tts';
import { SLEEP_TIMER_OPTIONS } from '../hooks/use-tts';
import { VoicePicker } from './voice-picker';
import { TTSSettings } from './tts-settings';

// Speed presets — aligned with iOS TTSControlView (0.5x / 1x / 1.5x)
const SPEED_OPTIONS: Array<{ label: string; rate: number }> = [
  { label: '0.5x', rate: 0.5 },
  { label: '1x', rate: 1.0 },
  { label: '1.5x', rate: 1.5 },
];

interface TTSControlsProps {
  tts: UseTTSReturn;
  onClose: () => void;
  bookId?: string;
}

/**
 * Bottom bar TTS controls — aligned with iOS TTSControlView layout:
 *   [speed presets row]
 *   ─────────────────
 *   [play/pause] [skip] | [sleep timer] [voice] [settings]
 *   ─────────────────
 *   [exit TTS]
 */
export function TTSControls({ tts, onClose, bookId }: TTSControlsProps) {
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSleepMenu, setShowSleepMenu] = useState(false);

  const { ttsState, settings, progress, sleepTimerRemaining, setRate, setSleepTimer, togglePlayPause, nextSentence, isSupported } = tts;

  if (!isSupported) {
    return (
      <div className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/80 px-4 py-3 backdrop-blur-sm text-center text-sm text-muted-foreground">
        您的浏览器不支持语音朗读
      </div>
    );
  }

  const isActive = ttsState === 'playing' || ttsState === 'paused' || ttsState === 'loading';
  const isCloud = typeof settings.audioSource !== 'string';

  const sleepLabel = (() => {
    if (sleepTimerRemaining !== null) {
      const m = Math.ceil(sleepTimerRemaining / 60);
      return `${m}m`;
    }
    if (settings.sleepTimerMinutes === -1) return '章末';
    return '定时';
  })();

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/90 backdrop-blur-sm shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        {/* Progress bar */}
        {isActive && progress && (
          <div className="h-0.5 w-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        )}

        {/* Current sentence preview */}
        {isActive && progress?.currentText && (
          <div className="border-b px-4 py-2">
            <p className="line-clamp-1 text-xs text-muted-foreground">{progress.currentText}</p>
          </div>
        )}

        {/* Speed presets row */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-1">
          {SPEED_OPTIONS.map(({ label, rate }) => {
            const selected = Math.abs(settings.rate - rate) < 0.05;
            return (
              <button
                key={rate}
                onClick={() => setRate(rate)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  selected
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'bg-muted/60 text-foreground hover:bg-muted'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="my-2 h-px bg-border mx-5" />

        {/* Controls row */}
        <div className="flex items-center px-4 pb-2">
          {/* Play / Pause + Skip */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={togglePlayPause}
            >
              {ttsState === 'loading' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : ttsState === 'playing' ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={nextSentence}
              disabled={!isActive}
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1" />

          {/* Settings icons: sleep timer + voice + settings */}
          <div className="flex items-center gap-1">
            {/* Sleep timer */}
            <div className="relative">
              <button
                onClick={() => setShowSleepMenu((v) => !v)}
                className="flex flex-col items-center gap-0.5 px-3 py-1 text-foreground hover:text-primary"
              >
                <Moon className={`h-5 w-5 ${sleepTimerRemaining !== null ? 'text-orange-500' : ''}`} />
                <span className={`text-[10px] ${sleepTimerRemaining !== null ? 'text-orange-500' : 'text-muted-foreground'}`}>
                  {sleepLabel}
                </span>
              </button>
              {showSleepMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-36 rounded-xl border bg-background shadow-lg py-1">
                  {SLEEP_TIMER_OPTIONS.map(({ value, label }) => {
                    const active =
                      value === 0
                        ? settings.sleepTimerMinutes === null
                        : settings.sleepTimerMinutes === value;
                    return (
                      <button
                        key={value}
                        onClick={() => {
                          setSleepTimer(value as SleepTimerOptionValue);
                          setShowSleepMenu(false);
                        }}
                        className={`flex w-full items-center justify-between px-4 py-2 text-sm ${
                          active ? 'text-primary font-medium' : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        {label}
                        {active && <span className="text-primary">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Voice picker */}
            <button
              onClick={() => setShowVoicePicker(true)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 text-foreground hover:text-primary"
            >
              <PersonStanding className="h-5 w-5" />
              <span className="text-[10px] text-muted-foreground">
                {isCloud ? '云端' : '声音'}
              </span>
            </button>

            {/* Advanced settings */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 text-foreground hover:text-primary"
            >
              <Settings className="h-5 w-5" />
              <span className="text-[10px] text-muted-foreground">设置</span>
            </button>
          </div>
        </div>

        <div className="mx-5 h-px bg-border" />

        {/* Exit */}
        <button
          onClick={onClose}
          className="w-full py-3 text-sm font-medium text-red-500 hover:text-red-600 active:bg-red-50"
        >
          退出朗读
        </button>
      </div>

      <VoicePicker
        open={showVoicePicker}
        onOpenChange={setShowVoicePicker}
        tts={tts}
        bookId={bookId}
      />

      <TTSSettings
        open={showSettings}
        onOpenChange={setShowSettings}
        tts={tts}
      />
    </>
  );
}

/**
 * Mini floating pill — shown when TTS is active but full controls are hidden.
 * Tap to open full controls.
 */
interface MiniTTSControlsProps {
  tts: UseTTSReturn;
  onExpand: () => void;
}

export function MiniTTSControls({ tts, onExpand }: MiniTTSControlsProps) {
  const { ttsState, isSupported, togglePlayPause } = tts;
  if (!isSupported) return null;

  const isActive = ttsState === 'playing' || ttsState === 'paused' || ttsState === 'loading';
  if (!isActive) return null;

  return (
    <div
      className="flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-transform"
      onClick={onExpand}
    >
      <Volume2 className="h-4 w-4" />
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
        onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
      >
        {ttsState === 'loading' ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : ttsState === 'playing' ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
