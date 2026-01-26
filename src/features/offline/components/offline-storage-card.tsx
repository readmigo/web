'use client';

import { useState } from 'react';
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
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  FileText,
  Image,
  Music,
  Loader2,
} from 'lucide-react';
import { useOfflineStorage, formatBytes } from '../hooks/use-offline-storage';

const CACHE_ICONS: Record<string, React.ReactNode> = {
  epub: <FileText className="h-4 w-4" />,
  images: <Image className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  default: <Database className="h-4 w-4" />,
};

function getCacheIcon(cacheName: string): React.ReactNode {
  const lowerName = cacheName.toLowerCase();
  if (lowerName.includes('epub') || lowerName.includes('book')) {
    return CACHE_ICONS.epub;
  }
  if (lowerName.includes('image') || lowerName.includes('img')) {
    return CACHE_ICONS.images;
  }
  if (lowerName.includes('audio') || lowerName.includes('media')) {
    return CACHE_ICONS.audio;
  }
  return CACHE_ICONS.default;
}

function getCacheDisplayName(cacheName: string): string {
  // Convert cache names to user-friendly labels
  const nameMap: Record<string, string> = {
    'workbox-precache': 'App Assets',
    'api-cache': 'API Responses',
    'image-cache': 'Images',
    'audio-cache': 'Audio Files',
    'epub-cache': 'EPUB Books',
    'next-data': 'Page Data',
  };

  for (const [key, value] of Object.entries(nameMap)) {
    if (cacheName.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  return cacheName;
}

export function OfflineStorageCard() {
  const {
    isLoading,
    storageInfo,
    caches,
    localStorageSize,
    totalOfflineSize,
    isOnline,
    refreshStorageInfo,
    clearCache,
    clearAllOfflineData,
  } = useOfflineStorage();

  const [isClearing, setIsClearing] = useState(false);
  const [clearingCache, setClearingCache] = useState<string | null>(null);

  const handleClearCache = async (cacheName: string) => {
    setClearingCache(cacheName);
    await clearCache(cacheName);
    setClearingCache(null);
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    await clearAllOfflineData();
    setIsClearing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Offline Storage
            </CardTitle>
            <CardDescription>Manage cached content for offline reading</CardDescription>
          </div>
          <Badge variant={isOnline ? 'default' : 'secondary'} className="flex items-center gap-1">
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Offline
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage Usage Overview */}
        {storageInfo && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Storage Used</span>
              <span className="font-medium">
                {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}
              </span>
            </div>
            <Progress value={storageInfo.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {storageInfo.percentage.toFixed(1)}% of available storage used
            </p>
          </div>
        )}

        {/* Total Offline Content */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Total Offline Content</p>
              <p className="text-sm text-muted-foreground">
                Cached data available for offline use
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{formatBytes(totalOfflineSize)}</p>
            </div>
          </div>
        </div>

        {/* Cache Breakdown */}
        {caches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Cache Details</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refreshStorageInfo()}
                disabled={isLoading}
              >
                <RefreshCw className={`mr-1 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="space-y-2">
              {caches.map((cache) => (
                <div
                  key={cache.name}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      {getCacheIcon(cache.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{getCacheDisplayName(cache.name)}</p>
                      <p className="text-xs text-muted-foreground">
                        {cache.entries} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatBytes(cache.size)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClearCache(cache.name)}
                      disabled={clearingCache === cache.name}
                    >
                      {clearingCache === cache.name ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}

              {/* Local Storage */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Local Data</p>
                    <p className="text-xs text-muted-foreground">
                      Settings, bookmarks, highlights
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatBytes(localStorageSize)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-destructive hover:text-destructive"
                disabled={isClearing}
              >
                {isClearing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Clear All Cached Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all cached data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all cached content including books, images, and audio files.
                  Your reading progress, bookmarks, and highlights will be preserved but may need
                  to be re-downloaded when you go offline.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAll}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Offline Reading Info */}
        <div className="rounded-lg bg-muted/50 p-4 text-sm">
          <p className="font-medium">About Offline Reading</p>
          <p className="mt-1 text-muted-foreground">
            Books you've read are automatically cached for offline access. When you're offline,
            you can continue reading any previously opened content.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
