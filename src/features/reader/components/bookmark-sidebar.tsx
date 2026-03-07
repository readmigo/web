'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Bookmark, Trash2 } from 'lucide-react';
import { useReaderStore } from '../stores/reader-store';

interface BookmarkSidebarProps {
  bookId: string;
  onNavigateToBookmark?: (cfi: string) => void;
}

export function BookmarkSidebar({ bookId, onNavigateToBookmark }: BookmarkSidebarProps) {
  const t = useTranslations('reader');
  const { bookmarks, removeBookmark } = useReaderStore();
  const bookBookmarks = bookmarks
    .filter((b) => b.bookId === bookId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t('bookmarks')}>
          <Bookmark className="h-5 w-5" />
          {bookBookmarks.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {bookBookmarks.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[360px] sm:w-[480px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            {t('bookmarksCount', { count: bookBookmarks.length })}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
          {bookBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Bookmark className="h-8 w-8 mb-2 opacity-50" />
              <p>{t('noBookmarks')}</p>
              <p className="text-sm">{t('addBookmarkHint')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bookBookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 cursor-pointer"
                  onClick={() => onNavigateToBookmark?.(bookmark.cfi)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{bookmark.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {bookmark.createdAt.toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('deleteBookmark', { title: bookmark.title })}
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBookmark(bookmark.id, bookId);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
