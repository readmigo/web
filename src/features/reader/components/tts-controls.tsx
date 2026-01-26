'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Settings,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { UseTTSReturn } from '../hooks/use-tts';

interface TTSControlsProps {
  tts: UseTTSReturn;
  onClose: () => void;
  isExpanded?: boolean;
}

export function TTSControls({ tts, onClose, isExpanded = false }: TTSControlsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { state, settings, voices, isSupported, updateSettings } = tts;

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
        <VolumeX className="h-4 w-4" />
        <span>Text-to-speech is not supported in your browser</span>
      </div>
    );
  }

  // Get Chinese voices (prioritize) or all voices
  const chineseVoices = voices.filter((v) => v.lang.startsWith('zh'));
  const displayVoices = chineseVoices.length > 0 ? chineseVoices : voices.slice(0, 10);

  return (
    <div className="rounded-lg border bg-background p-4 shadow-lg">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          <span className="font-medium">Text-to-Speech</span>
        </div>
        <div className="flex items-center gap-1">
          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>TTS Settings</SheetTitle>
                <SheetDescription>
                  Customize voice and playback settings
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Voice Selection */}
                <div className="space-y-2">
                  <Label>Voice</Label>
                  <Select
                    value={settings.voiceURI || ''}
                    onValueChange={(value) => updateSettings({ voiceURI: value || null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {displayVoices.map((voice) => (
                        <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                          <div className="flex items-center gap-2">
                            <span>{voice.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({voice.lang})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Speed */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Speed</Label>
                    <span className="text-sm text-muted-foreground">
                      {settings.rate.toFixed(1)}x
                    </span>
                  </div>
                  <Slider
                    value={[settings.rate]}
                    min={0.5}
                    max={2}
                    step={0.1}
                    onValueChange={([value]) => updateSettings({ rate: value })}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.5x</span>
                    <span>2x</span>
                  </div>
                </div>

                {/* Pitch */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Pitch</Label>
                    <span className="text-sm text-muted-foreground">
                      {settings.pitch.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    value={[settings.pitch]}
                    min={0.5}
                    max={2}
                    step={0.1}
                    onValueChange={([value]) => updateSettings({ pitch: value })}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                {/* Volume */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Volume</Label>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(settings.volume * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[settings.volume]}
                    min={0}
                    max={1}
                    step={0.1}
                    onValueChange={([value]) => updateSettings({ volume: value })}
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      {state.isPlaying || state.isPaused ? (
        <div className="mb-4 space-y-2">
          <Progress value={state.progress} className="h-1" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Sentence {state.currentSentenceIndex + 1} of {state.totalSentences}
            </span>
            <span>{Math.round(state.progress)}%</span>
          </div>
          {state.currentText && (
            <p className="mt-2 line-clamp-2 rounded bg-muted p-2 text-sm">
              {state.currentText}
            </p>
          )}
        </div>
      ) : null}

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={tts.previousSentence}
          disabled={!state.isPlaying && !state.isPaused}
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          variant="default"
          size="icon"
          className="h-12 w-12"
          onClick={tts.togglePlayPause}
        >
          {state.isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={tts.nextSentence}
          disabled={!state.isPlaying && !state.isPaused}
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={tts.stop}
          disabled={!state.isPlaying && !state.isPaused}
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>

      {/* Speed quick adjust */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
          <Button
            key={speed}
            variant={settings.rate === speed ? 'default' : 'outline'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => updateSettings({ rate: speed })}
          >
            {speed}x
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * Mini TTS control bar for compact display
 */
interface MiniTTSControlsProps {
  tts: UseTTSReturn;
  onExpand: () => void;
}

export function MiniTTSControls({ tts, onExpand }: MiniTTSControlsProps) {
  const { state, isSupported } = tts;

  if (!isSupported) return null;

  const isActive = state.isPlaying || state.isPaused;

  return (
    <div
      className="flex cursor-pointer items-center gap-3 rounded-full bg-primary px-4 py-2 text-primary-foreground shadow-lg transition-transform hover:scale-105"
      onClick={onExpand}
    >
      <Volume2 className="h-4 w-4" />
      {isActive ? (
        <>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={(e) => {
                e.stopPropagation();
                tts.togglePlayPause();
              }}
            >
              {state.isPlaying ? (
                <Pause className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>
            <span className="text-xs">{Math.round(state.progress)}%</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={(e) => {
              e.stopPropagation();
              tts.stop();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </>
      ) : (
        <span className="text-xs">TTS</span>
      )}
    </div>
  );
}
