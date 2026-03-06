'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Headphones, BarChart3, Monitor, BookMarked } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { trackEvent } from '@/lib/analytics';
import type { LucideIcon } from 'lucide-react';

interface OnboardingPage {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  titleKey: string;
  subtitleKey: string;
  features: string[];
}

const PAGES: OnboardingPage[] = [
  {
    icon: BookMarked,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/12',
    titleKey: 'bookstore.title',
    subtitleKey: 'bookstore.subtitle',
    features: ['bookstore.f1', 'bookstore.f2', 'bookstore.f3'],
  },
  {
    icon: BookOpen,
    color: 'text-green-500',
    bgColor: 'bg-green-500/12',
    titleKey: 'reader.title',
    subtitleKey: 'reader.subtitle',
    features: ['reader.f1', 'reader.f2', 'reader.f3'],
  },
  {
    icon: Headphones,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/12',
    titleKey: 'audiobooks.title',
    subtitleKey: 'audiobooks.subtitle',
    features: ['audiobooks.f1', 'audiobooks.f2', 'audiobooks.f3'],
  },
  {
    icon: BarChart3,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/12',
    titleKey: 'progress.title',
    subtitleKey: 'progress.subtitle',
    features: ['progress.f1', 'progress.f2', 'progress.f3'],
  },
  {
    icon: Monitor,
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/12',
    titleKey: 'crossPlatform.title',
    subtitleKey: 'crossPlatform.subtitle',
    features: ['crossPlatform.f1', 'crossPlatform.f2', 'crossPlatform.f3'],
  },
];

interface OnboardingViewProps {
  onComplete: () => void;
}

export function OnboardingView({ onComplete }: OnboardingViewProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const t = useTranslations('onboarding');

  const isLastPage = currentPage === PAGES.length - 1;
  const page = PAGES[currentPage];
  const Icon = page.icon;

  const handleNext = useCallback(() => {
    trackEvent('onboarding_step_completed', { step: currentPage });

    if (isLastPage) {
      trackEvent('onboarding_completed', { completionPage: currentPage });
      onComplete();
    } else {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, isLastPage, onComplete]);

  const handleSkip = useCallback(() => {
    trackEvent('onboarding_completed', { completionPage: currentPage, skipped: true });
    onComplete();
  }, [currentPage, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Skip button */}
      {!isLastPage && (
        <div className="flex justify-end p-4">
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            {t('skip')}
          </Button>
        </div>
      )}
      {isLastPage && <div className="h-14" />}

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        {/* Icon */}
        <div
          className={cn(
            'flex h-24 w-24 items-center justify-center rounded-full transition-transform duration-500',
            page.bgColor,
          )}
          style={{ animation: 'onboarding-scale 0.5s ease-out' }}
        >
          <Icon className={cn('h-12 w-12', page.color)} />
        </div>

        {/* Title & Subtitle */}
        <h2
          className="mt-8 text-center text-2xl font-bold"
          style={{ animation: 'onboarding-fade-up 0.5s ease-out 0.2s both' }}
        >
          {t(page.titleKey)}
        </h2>
        <p
          className="mt-3 text-center text-muted-foreground"
          style={{ animation: 'onboarding-fade-up 0.5s ease-out 0.3s both' }}
        >
          {t(page.subtitleKey)}
        </p>

        {/* Features */}
        <div
          className="mt-8 space-y-3"
          style={{ animation: 'onboarding-fade-up 0.5s ease-out 0.4s both' }}
        >
          {page.features.map((featureKey) => (
            <div key={featureKey} className="flex items-center gap-3">
              <div className={cn('h-2 w-2 rounded-full', page.color.replace('text-', 'bg-'))} />
              <span className="text-sm">{t(featureKey)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom section */}
      <div className="px-8 pb-12">
        {/* Dots */}
        <div className="mb-6 flex justify-center gap-2">
          {PAGES.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                idx === currentPage ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30',
              )}
            />
          ))}
        </div>

        {/* Action button */}
        <Button className="w-full h-12 text-base" onClick={handleNext}>
          {isLastPage ? t('start') : t('next')}
        </Button>
      </div>

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes onboarding-scale {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes onboarding-fade-up {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
