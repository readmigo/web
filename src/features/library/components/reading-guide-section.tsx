'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReadingGuide } from '../types';

interface CollapsibleSectionProps {
  title: string;
  content: string;
  defaultOpen?: boolean;
}

function CollapsibleSection({
  title,
  content,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-3 text-left text-sm font-medium transition-colors hover:text-primary"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="pb-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
          {content}
        </div>
      )}
    </div>
  );
}

interface ReadingGuideSectionProps {
  guide: ReadingGuide;
}

export function ReadingGuideSection({ guide }: ReadingGuideSectionProps) {
  const t = useTranslations('bookDetail');
  const sections = [
    { title: t('readingWarnings'), content: guide.readingWarnings },
    { title: t('storyTimeline'), content: guide.storyTimeline },
    { title: t('quickStart'), content: guide.quickStartGuide },
  ].filter((s) => s.content);

  if (sections.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('readingGuide')}</h2>
          {guide.sourceType === 'AI_GENERATED' && (
            <Badge variant="secondary" className="text-xs">
              {t('aiGenerated')}
            </Badge>
          )}
        </div>
        <div className="divide-y">
          {sections.map((section, index) => (
            <CollapsibleSection
              key={section.title}
              title={section.title}
              content={section.content!}
              defaultOpen={index === 0}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
