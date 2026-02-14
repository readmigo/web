'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookText, ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookContext } from '../types';

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

const sourceLabels: Record<string, string> = {
  WIKIPEDIA: 'Wikipedia',
  STANDARD_EBOOKS: 'Standard Ebooks',
  OPEN_LIBRARY: 'Open Library',
  WIKIDATA: 'Wikidata',
  MANUAL: '人工编辑',
};

interface BookContextSectionProps {
  context: BookContext;
}

export function BookContextSection({ context }: BookContextSectionProps) {
  const sections = [
    { title: '创作背景', content: context.creationBackground },
    { title: '历史背景', content: context.historicalContext },
    { title: '主题', content: context.themes },
    { title: '文学风格', content: context.literaryStyle },
  ].filter((s) => s.content);

  if (sections.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <BookText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">图书背景</h2>
          <Badge variant="secondary" className="text-xs">
            {sourceLabels[context.sourceType] || context.sourceType}
          </Badge>
        </div>
        {context.summary && (
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            {context.summary}
          </p>
        )}
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
        {context.sourceUrl && (
          <div className="mt-4 border-t pt-3">
            <a
              href={context.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              <ExternalLink className="h-3 w-3" />
              <span>查看来源</span>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
