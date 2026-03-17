'use client';

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Download, Share2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SHARE_CARD_THEMES } from './types';
import type { ShareCardTheme, ShareCardContent } from './types';
import { useShareCard } from './use-share-card';
import { ShareCardPreview } from './share-card-preview';

const THEME_ORDER: ShareCardTheme[] = [
  'light',
  'dark',
  'warm',
  'vintage',
  'nature',
  'elegant',
  'ocean',
  'sunset',
];

interface ShareCardDialogProps {
  open: boolean;
  content: ShareCardContent;
  onClose: () => void;
}

/**
 * Full-featured share card dialog with:
 *  - Real-time card preview (left on desktop, top on mobile)
 *  - 8-theme selector
 *  - Copy text, save as image, system share actions
 */
export function ShareCardDialog({ open, content, onClose }: ShareCardDialogProps) {
  const t = useTranslations('shareCard');
  const { theme, setTheme, cardRef, copyText, saveAsImage, shareCard, canShare, isSaving } =
    useShareCard({ content });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={cn(
          // Mobile: near-full screen sheet from bottom
          'fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0',
          'max-h-[92dvh] w-full rounded-t-2xl rounded-b-none',
          'flex flex-col gap-0 p-0 overflow-hidden',
          // Desktop: centered dialog
          'sm:bottom-auto sm:left-[50%] sm:top-[50%]',
          'sm:translate-x-[-50%] sm:translate-y-[-50%]',
          'sm:max-w-2xl sm:rounded-2xl sm:max-h-[90vh]',
        )}
      >
        {/* Drag handle (mobile only) */}
        <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30 sm:hidden" />

        <DialogHeader className="shrink-0 px-5 pt-4 pb-3 sm:pt-6">
          <DialogTitle className="text-base font-semibold">{t('title')}</DialogTitle>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-5 sm:flex-row sm:items-start">
          {/* Card preview */}
          <div className="sm:flex-1">
            <ShareCardPreview ref={cardRef} theme={theme} content={content} />
          </div>

          {/* Right panel: theme selector */}
          <div className="shrink-0 sm:w-44">
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('theme')}
            </p>

            {/* Mobile: horizontal scroll; desktop: 2-col grid */}
            <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-x-visible sm:pb-0">
              {THEME_ORDER.map((t_name) => {
                const cfg = SHARE_CARD_THEMES[t_name];
                const isSelected = theme === t_name;
                return (
                  <button
                    key={t_name}
                    aria-label={t_name}
                    aria-pressed={isSelected}
                    onClick={() => setTheme(t_name)}
                    className={cn(
                      'relative shrink-0 h-10 w-10 rounded-xl border-2 transition-all',
                      'sm:h-12 sm:w-full sm:flex sm:items-center sm:gap-2 sm:px-2',
                      isSelected
                        ? 'border-primary shadow-md scale-105'
                        : 'border-transparent hover:border-muted-foreground/40',
                    )}
                    style={{ backgroundColor: cfg.backgroundColor }}
                  >
                    {/* Theme colour dot (mobile shows just the button itself) */}
                    <span
                      className="hidden sm:block h-4 w-4 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: cfg.accentColor }}
                    />
                    <span
                      className="hidden sm:block text-xs font-medium truncate capitalize"
                      style={{ color: cfg.textColor }}
                    >
                      {t_name}
                    </span>
                    {cfg.isPremium && (
                      <span
                        className={cn(
                          'absolute -right-1 -top-1 rounded-full px-1 py-0.5 text-[8px] font-bold leading-none',
                          'bg-amber-400 text-amber-900',
                          'sm:static sm:ml-auto sm:text-[9px] sm:px-1',
                        )}
                      >
                        PRO
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="shrink-0 border-t px-5 py-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 flex-col h-14 gap-1 text-xs"
            onClick={copyText}
            aria-label={t('copyText')}
          >
            <Copy className="h-4 w-4" />
            {t('copyText')}
          </Button>

          <Button
            variant="outline"
            className="flex-1 flex-col h-14 gap-1 text-xs"
            onClick={saveAsImage}
            disabled={isSaving}
            aria-label={t('saveImage')}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t('saveImage')}
          </Button>

          {canShare && (
            <Button
              className="flex-1 flex-col h-14 gap-1 text-xs"
              onClick={shareCard}
              aria-label={t('share')}
            >
              <Share2 className="h-4 w-4" />
              {t('share')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
