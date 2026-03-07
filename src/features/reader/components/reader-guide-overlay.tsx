'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface ReaderGuideOverlayProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function ReaderGuideOverlay({ onComplete, onSkip }: ReaderGuideOverlayProps) {
  const t = useTranslations('reader');
  const [step, setStep] = useState(0);

  const GUIDE_STEPS = [
    { title: t('guide.step1.title'), description: t('guide.step1.desc'), icon: '👆' },
    { title: t('guide.step2.title'), description: t('guide.step2.desc'), icon: '📖' },
    { title: t('guide.step3.title'), description: t('guide.step3.desc'), icon: '✏️' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSkip]);

  const isLast = step === GUIDE_STEPS.length - 1;
  const current = GUIDE_STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        className="relative w-80 rounded-2xl bg-background p-6 shadow-2xl"
      >
        {/* Step indicator */}
        <div className="flex justify-center gap-1.5 mb-6">
          {GUIDE_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center space-y-3 mb-6">
          <div className="text-4xl">{current.icon}</div>
          <h3 id="guide-title" className="font-semibold text-lg">{current.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1" onClick={onSkip}>
            {t('guide.skip')}
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => {
              if (isLast) {
                onComplete();
              } else {
                setStep((s) => s + 1);
              }
            }}
          >
            {isLast ? t('guide.start') : t('guide.next')}
          </Button>
        </div>
      </div>
    </div>
  );
}
