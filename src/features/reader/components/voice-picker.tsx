'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CheckCircle2, PlayCircle, StopCircle, Lock, Loader2 } from 'lucide-react';
import type { UseTTSReturn, SystemVoice, CloudVoice } from '../hooks/use-tts';
import { useFeatureGate } from '@/features/subscription/hooks/use-feature-gate';
import { PaywallView } from '@/features/subscription/components/paywall-view';

type GenderFilter = 'all' | 'female' | 'male';

interface VoicePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tts: UseTTSReturn;
  bookId?: string;
}

export function VoicePicker({ open, onOpenChange, tts, bookId }: VoicePickerProps) {
  const t = useTranslations('reader');
  const tCommon = useTranslations('common');
  const { settings, systemVoices, cloudVoices, cloudVoicesError, setCloudVoice, setSystemVoice, loadCloudVoices } = tts;
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewSynthRef = useRef<SpeechSynthesis | null>(null);
  const { requireFeature } = useFeatureGate();

  useEffect(() => {
    if (open) {
      loadCloudVoices(bookId, t('cloudVoicesError'));
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        previewSynthRef.current = window.speechSynthesis;
      }
    }
    return () => stopPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const stopPreview = () => {
    previewSynthRef.current?.cancel();
    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
    setPreviewingId(null);
  };

  const previewCloudVoice = (voice: CloudVoice) => {
    if (!voice.sampleUrl) return;
    stopPreview();
    setPreviewingId(voice.voiceId);
    const audio = new Audio(voice.sampleUrl);
    previewAudioRef.current = audio;
    audio.onended = () => setPreviewingId(null);
    audio.onerror = () => setPreviewingId(null);
    audio.play().catch(() => setPreviewingId(null));
  };

  const previewSystemVoice = (voice: SystemVoice) => {
    if (!previewSynthRef.current) return;
    stopPreview();
    setPreviewingId(voice.id);
    const utt = new SpeechSynthesisUtterance('Hello, this is how I sound when reading.');
    const avVoice = previewSynthRef.current.getVoices().find((v) => v.voiceURI === voice.voiceURI);
    if (avVoice) utt.voice = avVoice;
    utt.onend = () => setPreviewingId(null);
    previewSynthRef.current.speak(utt);
    // Auto-clear after ~4s in case onend doesn't fire
    setTimeout(() => setPreviewingId((id) => (id === voice.id ? null : id)), 4000);
  };

  const handleCloudVoiceTap = (voice: CloudVoice) => {
    if (!voice.available) { setShowPaywall(true); return; }
    if (!requireFeature('cloudTTS', 'cloud_tts')) return;
    stopPreview();
    setCloudVoice(voice.voiceId);
    onOpenChange(false);
  };

  const handleSystemVoiceTap = (voice: SystemVoice) => {
    stopPreview();
    setSystemVoice(voice.voiceURI);
    onOpenChange(false);
  };

  const isCloudSelected = (voice: CloudVoice) =>
    typeof settings.audioSource !== 'string' && settings.audioSource.cloud === voice.voiceId;

  const isSystemSelected = (voice: SystemVoice) =>
    settings.audioSource === 'system' && settings.voiceURI === voice.voiceURI;

  const filteredSystemVoices = systemVoices.filter((v) => {
    if (genderFilter === 'all') return true;
    return v.gender === genderFilter;
  });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="pb-2">
            <SheetTitle>{t('selectVoice')}</SheetTitle>
          </SheetHeader>

          {/* Cloud voices */}
          <section className="mb-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('cloudVoices')}
            </h3>
            {cloudVoicesError ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <p className="text-sm text-muted-foreground">{cloudVoicesError}</p>
                <Button variant="outline" size="sm" onClick={() => loadCloudVoices(bookId)}>
                  {tCommon('retry')}
                </Button>
              </div>
            ) : cloudVoices.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{tCommon('loadingText')}</span>
              </div>
            ) : (
              <div className="space-y-1">
                {cloudVoices.map((voice) => {
                  const selected = isCloudSelected(voice);
                  const previewing = previewingId === voice.voiceId;
                  const locked = !voice.available;
                  return (
                    <div
                      key={voice.voiceId}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/60 active:bg-muted"
                      style={{ opacity: locked ? 0.6 : 1 }}
                      onClick={() => handleCloudVoiceTap(voice)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium">{voice.displayName}</span>
                          {(voice.minPlan.toUpperCase() === 'PREMIUM' || voice.minPlan.toUpperCase() === 'PRO') && (
                            <span className="rounded px-1 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700">
                              Pro
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{voice.accent}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (locked) { setShowPaywall(true); return; }
                          if (previewing) { stopPreview(); } else { previewCloudVoice(voice); }
                        }}
                      >
                        {locked ? (
                          <Lock className="h-4 w-4 text-orange-500" />
                        ) : previewing ? (
                          <StopCircle className="h-4 w-4 text-red-500" />
                        ) : selected ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <PlayCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Device voices */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('deviceVoices')}
            </h3>

            {/* Gender filter chips */}
            <div className="mb-3 flex gap-2">
              {(['all', 'female', 'male'] as GenderFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setGenderFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    genderFilter === f
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {f === 'all' ? t('voiceAll') : f === 'female' ? t('voiceFemale') : t('voiceMale')}
                </button>
              ))}
            </div>

            {filteredSystemVoices.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('noMatchingVoices')}</p>
            ) : (
              <div className="space-y-1">
                {filteredSystemVoices.map((voice) => {
                  const selected = isSystemSelected(voice);
                  const previewing = previewingId === voice.id;
                  return (
                    <div
                      key={voice.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/60 active:bg-muted"
                      onClick={() => handleSystemVoiceTap(voice)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium">{voice.name}</span>
                          {voice.quality === 'enhanced' && (
                            <span className="rounded px-1 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700">
                              HD
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{voice.language}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (previewing) { stopPreview(); } else { previewSystemVoice(voice); }
                        }}
                      >
                        {previewing ? (
                          <StopCircle className="h-4 w-4 text-red-500" />
                        ) : selected ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <PlayCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </SheetContent>
      </Sheet>

      {/* Paywall */}
      {showPaywall && (
        <div className="fixed inset-0 z-[100]">
          <PaywallView
            triggerSource="cloud_tts"
            onDismiss={() => setShowPaywall(false)}
          />
        </div>
      )}
    </>
  );
}
