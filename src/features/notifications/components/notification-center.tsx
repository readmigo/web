'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Bell, BookOpen, Flame, Award, MessageSquare, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useInfiniteNotifications, useMarkAsRead } from '../hooks/use-notifications';
import type { NotificationItem } from '../types';
import type { LucideIcon } from 'lucide-react';

const TYPE_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  reading_reminder: { icon: BookOpen, color: 'text-blue-500 bg-blue-500/10' },
  streak_reminder: { icon: Flame, color: 'text-orange-500 bg-orange-500/10' },
  medal_unlocked: { icon: Award, color: 'text-yellow-500 bg-yellow-500/10' },
  support_reply: { icon: MessageSquare, color: 'text-green-500 bg-green-500/10' },
  post_liked: { icon: Heart, color: 'text-red-500 bg-red-500/10' },
};

function NotificationRow({ item }: { item: NotificationItem }) {
  const markAsRead = useMarkAsRead();
  const isUnread = item.status === 'SENT';
  const typeConfig = TYPE_ICONS[item.type] || { icon: Bell, color: 'text-muted-foreground bg-muted' };
  const Icon = typeConfig.icon;

  const handleClick = () => {
    if (isUnread) {
      markAsRead.mutate(item.id);
    }
  };

  return (
    <button
      className={cn(
        'flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted/50',
        isUnread && 'bg-primary/5',
      )}
      onClick={handleClick}
    >
      <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', typeConfig.color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn('text-sm truncate', isUnread && 'font-semibold')}>{item.title}</p>
          {isUnread && <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{item.body}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {new Date(item.createdAt).toLocaleString()}
        </p>
      </div>
    </button>
  );
}

export function NotificationCenter() {
  const t = useTranslations('notifications');
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteNotifications();

  const notifications = data?.pages.flatMap((p) => p.data) || [];

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Bell className="h-12 w-12 opacity-30" />
        <p className="mt-3 text-sm">{t('empty')}</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {notifications.map((item) => (
        <NotificationRow key={item.id} item={item} />
      ))}
      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      </div>
    </div>
  );
}
