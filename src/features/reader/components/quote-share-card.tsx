'use client';

import { ShareCardDialog } from '@/features/share-card/share-card-dialog';

interface QuoteShareCardProps {
  open: boolean;
  quoteText: string;
  bookTitle: string;
  authorName?: string;
  onClose: () => void;
}

/**
 * Thin wrapper so existing callers (SelectionBottomSheet etc.) need no changes.
 * Delegates to the full ShareCardDialog implementation.
 */
export function QuoteShareCard({
  open,
  quoteText,
  bookTitle,
  authorName,
  onClose,
}: QuoteShareCardProps) {
  return (
    <ShareCardDialog
      open={open}
      content={{
        text: quoteText,
        author: authorName,
        bookTitle,
        source: 'highlight',
      }}
      onClose={onClose}
    />
  );
}
