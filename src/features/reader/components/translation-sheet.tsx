'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Copy, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { trackEvent } from '@/lib/analytics';

interface TranslationSheetProps {
  open: boolean;
  originalText: string;
  bookId: string;
  onClose: () => void;
}

export function TranslationSheet({ open, originalText, bookId, onClose }: TranslationSheetProps) {
  const t = useTranslations('reader');
  const [translation, setTranslation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !originalText.trim()) return;
    trackEvent('sentence_action_performed', { action: 'translate_viewed', book_id: bookId });
    setTranslation(null);
    setIsLoading(true);

    let cancelled = false;
    apiClient
      .post<{ translation: string }>('/translate', {
        text: originalText,
        targetLanguage: 'zh',
        bookId,
      })
      .then((res) => {
        if (cancelled) return;
        const t = (res as { translation?: string }).translation;
        setTranslation(t ?? null);
      })
      .catch(() => {
        if (!cancelled) setTranslation(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [open, originalText, bookId]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 max-h-[60vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{t('translation')}</SheetTitle>
        </SheetHeader>

        {/* Original */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1">{t('originalText')}</p>
          <p className="text-sm leading-relaxed">{originalText}</p>
        </div>

        {/* Translation */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">{t('translatedText')}</p>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{t('translating')}</span>
            </div>
          ) : translation ? (
            <div className="space-y-2">
              <p className="text-sm leading-relaxed">{translation}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard.writeText(translation).catch(() => {})}
              >
                <Copy className="h-3 w-3 mr-1" />
                {t('copyTranslation')}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('translationFailed')}</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
