'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
import {
  HardDrive,
  Wifi,
  WifiOff,
  Trash2,
  Pause,
  Play,
  Loader2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useOfflineStore } from '../stores/offline-store';
import type { DownloadedBook } from '../types';
import { DOWNLOAD_STATUS_LABEL } from '../types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function StatusIcon({ status }: { status: DownloadedBook['status'] }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'downloading':
    case 'queued':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case 'paused':
      return <Pause className="h-4 w-4 text-orange-500" />;
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function DownloadedBookRow({ book }: { book: DownloadedBook }) {
  const { pauseDownload, resumeDownload, deleteBook } = useOfflineStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const isActive = book.status === 'downloading' || book.status === 'queued';
  const progress = book.totalChapters > 0
    ? (book.downloadedChapters / book.totalChapters) * 100
    : 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteBook(book.bookId);
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      {/* Cover */}
      <div className="relative h-[60px] w-[42px] flex-shrink-0 overflow-hidden rounded-md bg-muted">
        {book.coverUrl ? (
          <Image src={book.coverUrl} alt={book.title} fill className="object-cover" sizes="42px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-medium">{book.title}</p>
        <p className="truncate text-xs text-muted-foreground">{book.author}</p>
        <div className="flex items-center gap-2">
          <StatusIcon status={book.status} />
          <span className="text-xs text-muted-foreground">
            {DOWNLOAD_STATUS_LABEL[book.status]}
          </span>
          {book.downloadedSizeBytes > 0 && (
            <span className="text-xs text-muted-foreground">
              · {formatBytes(book.downloadedSizeBytes)}
            </span>
          )}
        </div>
        {isActive && (
          <Progress value={progress} className="h-1" />
        )}
        {isActive && (
          <p className="text-xs text-muted-foreground">
            {book.downloadedChapters}/{book.totalChapters} 章
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-1">
        {isActive && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => pauseDownload(book.bookId)}>
            <Pause className="h-3.5 w-3.5" />
          </Button>
        )}
        {book.status === 'paused' && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => resumeDownload(book.bookId)}>
            <Play className="h-3.5 w-3.5" />
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>删除离线内容？</AlertDialogTitle>
              <AlertDialogDescription>
                将删除《{book.title}》的离线缓存，需重新下载才能离线阅读。
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
    </div>
  );
}

export function OfflineDownloadsCard() {
  const {
    downloadedBooks,
    downloadQueue,
    isOnline,
    storageInfo,
    refreshStorageInfo,
    deleteAllOfflineContent,
    initialize,
    isInitialized,
  } = useOfflineStore();

  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (!isInitialized) initialize();
    else refreshStorageInfo();
  }, [isInitialized, initialize, refreshStorageInfo]);

  const activeQueueItems = downloadQueue.filter(
    (t) => t.status === 'downloading' || t.status === 'queued'
  );
  const booksInProgress = downloadedBooks.filter(
    (b) => b.status === 'downloading' || b.status === 'queued' || b.status === 'paused'
  );
  const booksCompleted = downloadedBooks.filter((b) => b.status === 'completed');

  const handleClearAll = async () => {
    setIsClearing(true);
    await deleteAllOfflineContent();
    setIsClearing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              离线下载
            </CardTitle>
            <CardDescription>已下载的书籍，可在无网络时阅读</CardDescription>
          </div>
          <Badge variant={isOnline ? 'default' : 'secondary'} className="flex items-center gap-1">
            {isOnline ? (
              <><Wifi className="h-3 w-3" />在线</>
            ) : (
              <><WifiOff className="h-3 w-3" />离线</>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Storage info */}
        {storageInfo && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">存储空间</span>
              <span className="font-medium">
                {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}
              </span>
            </div>
            <Progress value={storageInfo.percentage} className="h-1.5" />
          </div>
        )}

        {/* Active downloads queue summary */}
        {activeQueueItems.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span>{activeQueueItems.length} 个章节下载中...</span>
            </div>
          </div>
        )}

        {/* Books in progress */}
        {booksInProgress.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">下载中</p>
            <div className="space-y-2">
              {booksInProgress.map((book) => (
                <DownloadedBookRow key={book.bookId} book={book} />
              ))}
            </div>
          </div>
        )}

        {/* Completed books */}
        {booksCompleted.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">已下载</p>
            <div className="space-y-2">
              {booksCompleted.map((book) => (
                <DownloadedBookRow key={book.bookId} book={book} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {downloadedBooks.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">暂无离线书籍</p>
            <p className="text-sm text-muted-foreground">
              在书籍详情页点击「下载离线」，即可在无网络时阅读
            </p>
          </div>
        )}

        {/* Clear all */}
        {downloadedBooks.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                disabled={isClearing}
              >
                {isClearing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                清除所有离线内容
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>清除所有离线内容？</AlertDialogTitle>
                <AlertDialogDescription>
                  将删除所有已下载的书籍内容。阅读进度和书签不会受影响，但需重新下载才能离线阅读。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAll}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  清除全部
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
