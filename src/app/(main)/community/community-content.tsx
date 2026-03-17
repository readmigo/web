'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
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
import { CreatePostDialog } from '@/features/agora/components/create-post-dialog';
import { CommentSheet } from '@/features/agora/components/comment-sheet';

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
  const tc = useTranslations('common');
  const t = useTranslations('community');
  const queryClient = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // State for the comment sheet
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [commentPostContent, setCommentPostContent] = useState<string | undefined>();

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

  const handleCommentClick = (post: AgoraPost) => {
    setCommentPostId(post.id);
    setCommentPostContent(post.content);
  };

  const handleCommentSheetClose = () => {
    setCommentPostId(null);
    setCommentPostContent(undefined);
  };

  // ---- Loading State ----
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">{tc('loadingText')}</p>
      </div>
    );
  }

  // ---- Error State ----
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="mt-3 text-lg text-destructive">{tc('loadingFailed')}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : tc('retryLater')}
        </p>
        <Button className="mt-4" variant="outline" onClick={() => refetch()}>
          {tc('retry')}
        </Button>
      </div>
    );
  }

  // ---- Empty State ----
  if (posts.length === 0) {
    return (
      <>
        <div className="mb-4 flex items-center justify-end">
          <CreatePostDialog />
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <MessageSquare className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">{t('welcome')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('noActivity')}</p>
        </div>
      </>
    );
  }

  // ---- Post Feed ----
  return (
    <>
      {/* Header row with create button */}
      <div className="mb-4 flex items-center justify-end">
        <CreatePostDialog />
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLikeToggle={(postId, isLiked) => likeMutation.mutate({ postId, isLiked })}
            onCommentClick={() => handleCommentClick(post)}
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
              <p className="mt-1 text-sm">{t('noMore')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Comment Sheet — rendered at feed level to avoid re-mount on scroll */}
      <CommentSheet
        postId={commentPostId}
        postContent={commentPostContent}
        onClose={handleCommentSheetClose}
      />
    </>
  );
}

// ---- PostCard ----

function PostCard({
  post,
  onLikeToggle,
  onCommentClick,
}: {
  post: AgoraPost;
  onLikeToggle: (postId: string, isLiked: boolean) => void;
  onCommentClick: () => void;
}) {
  const tCommon = useTranslations('common');
  const t = useTranslations('community');
  const [expanded, setExpanded] = useState(false);

  const relativeTimeT = {
    justNow: tCommon('justNow'),
    minutesAgo: (count: number) => tCommon('minutesAgo', { count }),
    hoursAgo: (count: number) => tCommon('hoursAgo', { count }),
    daysAgo: (count: number) => tCommon('daysAgo', { count }),
    weeksAgo: (count: number) => tCommon('weeksAgo', { count }),
    monthsAgo: (count: number) => tCommon('monthsAgo', { count }),
    yearsAgo: (count: number) => tCommon('yearsAgo', { count }),
  };

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
            {formatRelativeTime(post.createdAt, relativeTimeT)}
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
          aria-label={post.isLiked ? 'Unlike post' : 'Like post'}
          aria-pressed={post.isLiked}
        >
          <Heart
            className={`h-4 w-4 ${post.isLiked ? 'fill-red-500' : ''}`}
          />
          {post.likeCount > 0 && <span>{post.likeCount}</span>}
        </button>

        <button
          onClick={onCommentClick}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t('comments')}
        >
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
