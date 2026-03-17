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
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  EyeOff,
  Flag,
  UserX,
} from 'lucide-react';
import { CreatePostDialog } from '@/features/agora/components/create-post-dialog';
import { CommentSheet } from '@/features/agora/components/comment-sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ---- Types ----

export interface MediaAttachment {
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

interface AgoraPost {
  id: string;
  authorId?: string;
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
  media?: MediaAttachment[];
  attachments?: MediaAttachment[];
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

  // State for locally hidden posts (hide / block author)
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());
  const [blockedAuthorIds, setBlockedAuthorIds] = useState<Set<string>>(new Set());

  // Inline feedback message (replaces a toast)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

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

  // Hide post mutation
  const hideMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiClient.post(`/agora/posts/${postId}/hide`);
    },
    onSuccess: (_data, postId) => {
      setHiddenPostIds((prev) => new Set(prev).add(postId));
      showFeedback(t('hideSuccess'));
    },
    onError: (_err, postId) => {
      // Optimistically hide anyway for a smooth UX
      setHiddenPostIds((prev) => new Set(prev).add(postId));
      showFeedback(t('hideSuccess'));
    },
  });

  // Report post mutation
  const reportMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiClient.post(`/agora/posts/${postId}/report`);
    },
    onSuccess: () => {
      showFeedback(t('reportSuccess'));
    },
  });

  // Block author mutation
  const blockMutation = useMutation({
    mutationFn: async (authorId: string) => {
      await apiClient.post(`/agora/users/${authorId}/block`);
    },
    onSuccess: (_data, authorId) => {
      setBlockedAuthorIds((prev) => new Set(prev).add(authorId));
      showFeedback(t('blockSuccess'));
    },
    onError: (_err, authorId) => {
      setBlockedAuthorIds((prev) => new Set(prev).add(authorId));
      showFeedback(t('blockSuccess'));
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

  // Flatten all pages and filter hidden / blocked
  const allPosts = data?.pages.flatMap((page) => page.data ?? []) || [];
  const posts = allPosts.filter(
    (post) =>
      !hiddenPostIds.has(post.id) &&
      !(post.authorId && blockedAuthorIds.has(post.authorId)),
  );

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
  if (posts.length === 0 && allPosts.length === 0) {
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

      {/* Inline feedback banner */}
      {feedbackMsg && (
        <div className="mb-3 rounded-lg bg-primary/10 px-4 py-2 text-sm text-primary text-center">
          {feedbackMsg}
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLikeToggle={(postId, isLiked) => likeMutation.mutate({ postId, isLiked })}
            onCommentClick={() => handleCommentClick(post)}
            onHide={(postId) => hideMutation.mutate(postId)}
            onReport={(postId) => reportMutation.mutate(postId)}
            onBlockAuthor={(authorId) => blockMutation.mutate(authorId)}
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

// ---- MediaGrid ----

function MediaGrid({
  items,
  onImageClick,
}: {
  items: MediaAttachment[];
  onImageClick: (index: number) => void;
}) {
  const count = items.length;
  const visible = items.slice(0, 9);
  const overflow = count > 4 ? count - 4 : 0;

  const gridClass =
    count === 1
      ? 'grid-cols-1'
      : count <= 4
        ? 'grid-cols-2'
        : 'grid-cols-3';

  return (
    <div className={`mt-3 grid gap-1 ${gridClass} rounded-xl overflow-hidden`}>
      {visible.map((item, i) => {
        const isOverflowCell = overflow > 0 && i === 3;
        const hiddenAfter4 = overflow > 0 && i > 3;
        if (hiddenAfter4) return null;

        if (item.type === 'video') {
          return (
            <button
              key={i}
              className="relative aspect-square overflow-hidden bg-black"
              onClick={() => onImageClick(i)}
              aria-label={`Play video ${i + 1}`}
            >
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="h-10 w-10 text-white drop-shadow" fill="white" />
              </div>
            </button>
          );
        }

        return (
          <button
            key={i}
            className="relative aspect-square overflow-hidden bg-muted"
            onClick={() => onImageClick(i)}
            aria-label={`View image ${i + 1}`}
          >
            <img
              src={item.url}
              alt=""
              className="h-full w-full object-cover"
            />
            {isOverflowCell && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-2xl font-bold text-white">+{overflow}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---- MediaLightbox ----

function MediaLightbox({
  items,
  initialIndex,
  onClose,
}: {
  items: MediaAttachment[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const current = items[index];

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(items.length - 1, i + 1));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
        aria-label="Close image viewer"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Prev */}
      {index > 0 && (
        <button
          onClick={prev}
          className="absolute left-4 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Media content */}
      <div className="max-h-[90vh] max-w-[90vw]">
        {current.type === 'video' ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            src={current.url}
            controls
            autoPlay
            className="max-h-[85vh] max-w-[85vw] rounded-lg"
          />
        ) : (
          <img
            src={current.url}
            alt=""
            className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
          />
        )}
      </div>

      {/* Next */}
      {index < items.length - 1 && (
        <button
          onClick={next}
          className="absolute right-4 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
          aria-label="Next image"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Counter */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
          {index + 1} / {items.length}
        </div>
      )}
    </div>
  );
}

// ---- PostCard ----

function PostCard({
  post,
  onLikeToggle,
  onCommentClick,
  onHide,
  onReport,
  onBlockAuthor,
}: {
  post: AgoraPost;
  onLikeToggle: (postId: string, isLiked: boolean) => void;
  onCommentClick: () => void;
  onHide: (postId: string) => void;
  onReport: (postId: string) => void;
  onBlockAuthor: (authorId: string) => void;
}) {
  const tCommon = useTranslations('common');
  const t = useTranslations('community');
  const [expanded, setExpanded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

  // Merge media and attachments fields
  const mediaItems: MediaAttachment[] = [...(post.media ?? []), ...(post.attachments ?? [])];

  return (
    <>
      {lightboxIndex !== null && (
        <MediaLightbox
          items={mediaItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
      <div className="relative bg-card rounded-xl shadow-sm p-4">
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

          {/* More options menu — only for posts not authored by the current user */}
          {!post.isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
                  aria-label={t('moreOptions')}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onSelect={() => onHide(post.id)}
                >
                  <EyeOff className="h-4 w-4" />
                  {t('notInterested')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onSelect={() => onReport(post.id)}
                >
                  <Flag className="h-4 w-4" />
                  {t('report')}
                </DropdownMenuItem>
                {post.authorId && (
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                    onSelect={() => onBlockAuthor(post.authorId!)}
                  >
                    <UserX className="h-4 w-4" />
                    {t('blockAuthor')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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

        {/* Media attachments */}
        {mediaItems.length > 0 && (
          <MediaGrid items={mediaItems} onImageClick={(i) => setLightboxIndex(i)} />
        )}

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
    </>
  );
}
