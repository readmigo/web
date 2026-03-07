'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, CheckCircle2, Pause, Play, Loader2, Trash2 } from 'lucide-react';
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

export function DownloadBookButton({ book }: DownloadBookButtonProps) {
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

  useEffect(() => {
    if (!isInitialized) initialize();
  }, [isInitialized, initialize]);

  const downloaded = downloadedBooks.find((b) => b.bookId === book.id);
  const status = downloaded?.status ?? 'not_downloaded';
  const progress = downloaded && downloaded.totalChapters > 0
    ? (downloaded.downloadedChapters / downloaded.totalChapters) * 100
    : 0;

  const handleDownload = () => {
    if (!requireFeature('offlineReading', 'download-book')) return;
    downloadBook(book);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteBook(book.id);
    setIsDeleting(false);
  };

  if (showPaywall) {
    return <PaywallView triggerSource="download-book" onDismiss={dismissPaywall} />;
  }

  // Not downloaded — show download button
  if (status === 'not_downloaded') {
    return (
      <Button variant="outline" className="w-full h-12 rounded-xl" onClick={handleDownload}>
        <Download className="mr-2 h-4 w-4" />
        下载离线阅读
        {!isPro && <span className="ml-2 text-xs opacity-70">Pro</span>}
      </Button>
    );
  }

  // Downloading / Queued — show progress + pause
  if (status === 'downloading' || status === 'queued') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>
            下载中 {downloaded?.downloadedChapters}/{downloaded?.totalChapters} 章
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
        <Button
          variant="outline"
          className="w-full rounded-xl"
          onClick={() => pauseDownload(book.id)}
        >
          <Pause className="mr-2 h-4 w-4" />
          暂停下载
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
            已暂停 {downloaded?.downloadedChapters}/{downloaded?.totalChapters} 章
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
        <Button
          variant="outline"
          className="w-full rounded-xl"
          onClick={() => resumeDownload(book.id)}
        >
          <Play className="mr-2 h-4 w-4" />
          继续下载
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
          <span className="text-sm font-medium">已下载离线阅读</span>
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
              <AlertDialogTitle>删除离线内容？</AlertDialogTitle>
              <AlertDialogDescription>
                将删除《{book.title}》的离线缓存。阅读进度和书签不会受影响。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                删除
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
      重试下载
    </Button>
  );
}
