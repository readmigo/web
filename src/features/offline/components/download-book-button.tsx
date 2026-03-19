'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Download, CheckCircle2, Pause, Play, Loader2, Trash2, Wifi } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useFeatureGate } from '@/features/subscription/hooks/use-feature-gate';
import { PaywallView } from '@/features/subscription/components/paywall-view';
import { useOfflineStore } from '../stores/offline-store';
import type { BookDetail } from '@/features/library/types';

interface DownloadBookButtonProps {
  book: BookDetail;
}

const SKIP_CELLULAR_KEY = 'skipCellularWarning';

// E9: Detect whether the current connection is cellular
function isCellularConnection(): boolean {
  if (typeof navigator === 'undefined') return false;
  // @ts-expect-error navigator.connection is not yet in TS lib types
  const conn = navigator.connection ?? navigator.mozConnection ?? navigator.webkitConnection;
  if (!conn) return false;
  const type: string = conn.effectiveType ?? conn.type ?? '';
  return ['cellular', '4g', '3g', '2g', 'slow-2g'].includes(type.toLowerCase());
}

export function DownloadBookButton({ book }: DownloadBookButtonProps) {
  const t = useTranslations('offline');
  const { requireFeature, showPaywall, dismissPaywall, isPro } = useFeatureGate();
  const {
    downloadedBooks,
    downloadBook,
    pauseDownload,
    resumeDownload,
    deleteBook,
    initialize,
    isInitialized,
  } = useOfflineStore();

  const [isDeleting, setIsDeleting] = useState(false);

  // E9: Cellular warning dialog state
  const [showCellularWarning, setShowCellularWarning] = useState(false);
  const [doNotAskAgain, setDoNotAskAgain] = useState(false);

  useEffect(() => {
    if (!isInitialized) initialize();
  }, [isInitialized, initialize]);

  const downloaded = downloadedBooks.find((b) => b.bookId === book.id);
  const status = downloaded?.status ?? 'not_downloaded';
  const progress = downloaded && downloaded.totalChapters > 0
    ? (downloaded.downloadedChapters / downloaded.totalChapters) * 100
    : 0;

  const triggerDownload = () => {
    if (!requireFeature('offlineDownload', 'download-book')) return;
    downloadBook(book);
  };

  // E9: Intercept download when on cellular and user hasn't opted out
  const handleDownload = () => {
    const skipped = localStorage.getItem(SKIP_CELLULAR_KEY) === '1';
    if (!skipped && isCellularConnection()) {
      setDoNotAskAgain(false);
      setShowCellularWarning(true);
      return;
    }
    triggerDownload();
  };

  const handleCellularConfirm = () => {
    if (doNotAskAgain) {
      localStorage.setItem(SKIP_CELLULAR_KEY, '1');
    }
    setShowCellularWarning(false);
    triggerDownload();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteBook(book.id);
    setIsDeleting(false);
  };

  if (showPaywall) {
    return <PaywallView trigger="downloadRequired" onDismiss={dismissPaywall} />;
  }

  // Not downloaded — show download button + E9 cellular warning dialog
  if (status === 'not_downloaded') {
    return (
      <>
        <Button variant="outline" className="w-full h-12 rounded-xl" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          {t('downloadForOffline')}
          {!isPro && <span className="ml-2 text-xs opacity-70">Pro</span>}
        </Button>

        {/* E9: Cellular network confirmation dialog */}
        <AlertDialog open={showCellularWarning} onOpenChange={setShowCellularWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-orange-500" />
                {t('cellularWarning')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('cellularWarningDesc')}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* "Do not ask again" checkbox */}
            <div className="flex items-center gap-2 py-1">
              <Checkbox
                id="doNotAskAgain"
                checked={doNotAskAgain}
                onCheckedChange={(checked) => setDoNotAskAgain(checked === true)}
              />
              <label
                htmlFor="doNotAskAgain"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                {t('doNotAskAgain')}
              </label>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowCellularWarning(false)}>
                {t('cancel')}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleCellularConfirm}>
                {t('continueDownload')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Downloading / Queued — show progress + pause
  if (status === 'downloading' || status === 'queued') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>
            {t('downloading', { downloaded: downloaded?.downloadedChapters ?? 0, total: downloaded?.totalChapters ?? 0 })}
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
        <Button
          variant="outline"
          className="w-full rounded-xl"
          onClick={() => pauseDownload(book.id)}
        >
          <Pause className="mr-2 h-4 w-4" />
          {t('pauseDownload')}
        </Button>
      </div>
    );
  }

  // Paused — show resume button
  if (status === 'paused') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Pause className="h-4 w-4 text-orange-500" />
          <span>
            {t('paused', { downloaded: downloaded?.downloadedChapters ?? 0, total: downloaded?.totalChapters ?? 0 })}
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
        <Button
          variant="outline"
          className="w-full rounded-xl"
          onClick={() => resumeDownload(book.id)}
        >
          <Play className="mr-2 h-4 w-4" />
          {t('resumeDownload')}
        </Button>
      </div>
    );
  }

  // Completed — show downloaded badge + delete option
  if (status === 'completed') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border bg-muted/50 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">{t('downloaded')}</span>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl flex-shrink-0" disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('deleteOfflineContent')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('deleteOfflineDesc', { title: book.title })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Failed — show retry button
  return (
    <Button variant="outline" className="w-full h-12 rounded-xl" onClick={handleDownload}>
      <Download className="mr-2 h-4 w-4" />
      {t('retryDownload')}
    </Button>
  );
}
