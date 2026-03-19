'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Copy, X } from 'lucide-react';
import { useReaderStore } from '../stores/reader-store';
import type { SelectedText } from '../types';

interface SelectionBottomSheetProps {
  selection: SelectedText;
  bookId: string;
  bookTitle?: string;
  authorName?: string;
  onClose: () => void;
}

export function SelectionBottomSheet({ selection, onClose }: SelectionBottomSheetProps) {
  const t = useTranslations('reader');
  const { setSelectedText } = useReaderStore();

  const dismiss = useCallback(() => {
    setSelectedText(null);
    onClose();
  }, [setSelectedText, onClose]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(selection.text.trim()).catch(() => {});
    dismiss();
  }, [selection.text, dismiss]);

  return (
    <Sheet open onOpenChange={(v) => !v && dismiss()}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-2">
        {/* Drag indicator */}
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted-foreground/30" />

        {/* Selected text preview */}
        <div className="mb-4 rounded-md bg-muted px-3 py-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            &ldquo;{selection.text}&rdquo;
          </p>
        </div>

        {/* Action row */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="flex-col h-16 gap-1" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
            <span className="text-xs">{t('copy')}</span>
          </Button>
          <Button variant="outline" className="flex-col h-16 gap-1" aria-label={t('cancel')} onClick={dismiss}>
            <X className="h-4 w-4" />
            <span className="text-xs">{t('cancel')}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
