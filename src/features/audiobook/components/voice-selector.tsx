'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Check, Mic2, Play, Square } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AudiobookVoice } from '../types';

interface VoiceSelectorProps {
  voices: AudiobookVoice[];
  selectedVoiceId: string | null;
  onVoiceSelect: (voiceId: string) => void;
}

export function VoiceSelector({ voices, selectedVoiceId, onVoiceSelect }: VoiceSelectorProps) {
  const t = useTranslations('audiobooks');
  const [isOpen, setIsOpen] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);

  function stopPreview() {
    if (previewRef.current) {
      previewRef.current.pause();
      previewRef.current.src = '';
      previewRef.current = null;
    }
    setPreviewingId(null);
  }

  function handlePreview(voice: AudiobookVoice) {
    if (!voice.previewUrl) return;

    if (previewingId === voice.id) {
      stopPreview();
      return;
    }

    stopPreview();

    const audio = new Audio(voice.previewUrl);
    previewRef.current = audio;
    setPreviewingId(voice.id);

    audio.play().catch(() => {
      setPreviewingId(null);
    });

    audio.addEventListener('ended', () => {
      setPreviewingId(null);
    });
  }

  function handleSelect(voiceId: string) {
    stopPreview();
    onVoiceSelect(voiceId);
    setIsOpen(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) stopPreview();
    setIsOpen(open);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        aria-label={t('voiceSelector')}
      >
        <Mic2 className="h-5 w-5" />
      </Button>

      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[60vh]">
          <SheetHeader className="mb-4">
            <SheetTitle>{t('selectVoice')}</SheetTitle>
          </SheetHeader>

          <ul className="space-y-1 overflow-y-auto pb-4" role="listbox" aria-label={t('selectVoice')}>
            {voices.map((voice) => {
              const isSelected = selectedVoiceId === voice.id;
              const isPreviewing = previewingId === voice.id;

              return (
                <li key={voice.id} role="option" aria-selected={isSelected}>
                  <div
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 transition-colors ${
                      isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    {/* Select button — covers name + language */}
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-3 text-left"
                      onClick={() => handleSelect(voice.id)}
                    >
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>
                          {voice.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{voice.language}</p>
                      </div>

                      {isSelected && (
                        <Check className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
                      )}
                    </button>

                    {/* Preview button — only when previewUrl exists */}
                    {voice.previewUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(voice);
                        }}
                        aria-label={isPreviewing ? t('stopPreview') : t('previewVoice', { name: voice.name })}
                      >
                        {isPreviewing ? (
                          <Square className="h-3.5 w-3.5 fill-current" />
                        ) : (
                          <Play className="h-3.5 w-3.5 fill-current" />
                        )}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
