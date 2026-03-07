'use client';

import { useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useReaderStore } from '../stores/reader-store';
import { cn } from '@/lib/utils';

interface QuoteShareCardProps {
  open: boolean;
  quoteText: string;
  bookTitle: string;
  authorName?: string;
  onClose: () => void;
}

export function QuoteShareCard({ open, quoteText, bookTitle, authorName, onClose }: QuoteShareCardProps) {
  const { settings } = useReaderStore();
  const isDark = settings.theme === 'dark' || settings.theme === 'ultraDark';

  const shareText = `"${quoteText}"\n— ${bookTitle}${authorName ? ` · ${authorName}` : ''}`;

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({ text: shareText }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(shareText).catch(() => {});
    }
  }, [shareText]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-full h-full max-w-full max-h-screen m-0 rounded-none flex flex-col">
        <DialogHeader>
          <DialogTitle>分享引用</DialogTitle>
        </DialogHeader>

        {/* Card Preview */}
        <div
          className={cn(
            'rounded-xl p-6 space-y-4',
            isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-amber-50 text-zinc-800'
          )}
        >
          <div className={cn('text-5xl font-serif leading-none', isDark ? 'text-zinc-600' : 'text-amber-300')}>
            &ldquo;
          </div>
          <p className="text-base leading-relaxed font-medium line-clamp-6">{quoteText}</p>
          <div className={cn('pt-2 border-t text-sm', isDark ? 'border-zinc-700 text-zinc-400' : 'border-amber-200 text-zinc-500')}>
            <p className="font-medium">{bookTitle}</p>
            {authorName && <p className="mt-0.5">{authorName}</p>}
          </div>
          <p className={cn('text-xs', isDark ? 'text-zinc-600' : 'text-amber-300')}>via Readmigo</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            分享
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
