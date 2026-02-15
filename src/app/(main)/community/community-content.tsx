'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Share2,
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  Loader2,
  BookOpen,
} from 'lucide-react';

// ---- Types ----

interface AgoraPost {
  id: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  bookId?: string;
  bookTitle?: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  isAuthor?: boolean;
  createdAt: string;
}

interface AgoraPostsResponse {
  data?: AgoraPost[];
  items?: AgoraPost[];
  total: number;
  page: number;
}

const PAGE_SIZE = 20;

// ---- Component ----

export function CommunityContent() {
  const queryClient = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite query for agora posts
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['agora-posts'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<AgoraPostsResponse>('/agora/posts', {
        params: { page: String(pageParam), limit: String(PAGE_SIZE) },
        noRedirectOn401: true,
      });
      return {
        ...response,
        data: response.items ?? response.data ?? [],
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((sum, page) => sum + (page.data?.length ?? 0), 0);
      if (loadedCount >= lastPage.total) {
        return undefined;
      }
      return allPages.length + 1;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (isLiked) {
        return apiClient.delete(`/agora/posts/${postId}/like`);
      } else {
        return apiClient.post(`/agora/posts/${postId}/like`);
      }
    },
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['agora-posts'] });

      const previousData = queryClient.getQueryData(['agora-posts']);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(['agora-posts'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: AgoraPostsResponse) => ({
            ...page,
            data: (page.data ?? []).map((post: AgoraPost) =>
              post.id === postId
                ? {
                    ...post,
                    isLiked: !isLiked,
                    likeCount: isLiked ? Math.max(0, post.likeCount - 1) : post.likeCount + 1,
                  }
                : post
            ),
          })),
        };
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['agora-posts'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['agora-posts'] });
    },
  });

  // IntersectionObserver for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '200px',
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [handleObserver]);

  // Flatten all pages
  const posts = data?.pages.flatMap((page) => page.data ?? []) || [];

  // ---- Loading State ----
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">加载中...</p>
      </div>
    );
  }

  // ---- Error State ----
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="mt-3 text-lg text-destructive">加载失败</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : '请稍后重试'}
        </p>
        <Button className="mt-4" variant="outline" onClick={() => refetch()}>
          重试
        </Button>
      </div>
    );
  }

  // ---- Empty State ----
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <MessageSquare className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">欢迎来到城邦</p>
        <p className="mt-1 text-sm text-muted-foreground">还没有任何动态</p>
      </div>
    );
  }

  // ---- Post Feed ----
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLikeToggle={(postId, isLiked) => likeMutation.mutate({ postId, isLiked })}
        />
      ))}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="flex justify-center py-6">
        {isFetchingNextPage && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
        {!hasNextPage && posts.length > 0 && (
          <div className="flex flex-col items-center text-muted-foreground">
            <CheckCircle className="h-5 w-5" />
            <p className="mt-1 text-sm">已经到底啦</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- PostCard ----

function PostCard({
  post,
  onLikeToggle,
}: {
  post: AgoraPost;
  onLikeToggle: (postId: string, isLiked: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // Generate avatar initials from author name
  const initials = post.authorName ? post.authorName.charAt(0).toUpperCase() : '?';

  return (
    <div className="bg-card rounded-xl shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {post.authorAvatar ? (
          <img
            src={post.authorAvatar}
            alt={post.authorName}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{post.authorName}</span>
            {post.isAuthor && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                Author
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(post.createdAt)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mt-3">
        <p
          className={`text-sm leading-relaxed whitespace-pre-wrap ${
            !expanded ? 'line-clamp-4' : ''
          }`}
          onClick={() => setExpanded(!expanded)}
        >
          {post.content}
        </p>
      </div>

      {/* Source book link */}
      {post.bookId && post.bookTitle && (
        <Link
          href={`/book/${post.bookId}`}
          className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span className="truncate">{post.bookTitle}</span>
        </Link>
      )}

      {/* Action Row */}
      <div className="mt-3 flex items-center gap-6">
        <button
          onClick={() => onLikeToggle(post.id, !!post.isLiked)}
          className={`flex items-center gap-1 text-sm transition-colors ${
            post.isLiked
              ? 'text-red-500'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Heart
            className={`h-4 w-4 ${post.isLiked ? 'fill-red-500' : ''}`}
          />
          {post.likeCount > 0 && <span>{post.likeCount}</span>}
        </button>

        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <MessageCircle className="h-4 w-4" />
          {post.commentCount > 0 && <span>{post.commentCount}</span>}
        </button>

        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
