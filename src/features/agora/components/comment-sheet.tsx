'use client';

import { useRef, useEffect, useCallback, useState, useId } from 'react';
import { useTranslations } from 'next-intl';
import { Heart, Trash2, Loader2, MessageSquare, Send, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { LoginPrompt } from '@/features/auth/components/login-prompt';
import { useRequireLogin } from '@/features/auth/hooks/use-require-login';
import { useMediaQuery } from '@/hooks/use-media-query';
import { formatRelativeTime } from '@/lib/utils';
import {
  useAgoraComments,
  useCreateComment,
  useDeleteComment,
  useLikeComment,
} from '../hooks/use-agora-comments';
import type { AgoraComment } from '../types';

interface CommentSheetProps {
  postId: string | null;
  postContent?: string;
  onClose: () => void;
}

export function CommentSheet({ postId, postContent, onClose }: CommentSheetProps) {
  const t = useTranslations('community');
  const tc = useTranslations('common');
  const inputId = useId();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [draftContent, setDraftContent] = useState('');

  const { requireLogin, showLoginPrompt, promptFeature, dismissPrompt } =
    useRequireLogin();

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAgoraComments(postId);

  const createComment = useCreateComment(postId ?? '');
  const deleteComment = useDeleteComment(postId ?? '');
  const likeComment = useLikeComment(postId ?? '');

  const comments = data?.pages.flatMap((page) => page.data ?? []) ?? [];
  const totalCount = data?.pages[0]?.total ?? 0;

  // Infinite scroll sentinel
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
      rootMargin: '100px',
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleObserver]);

  // Reset draft when sheet closes
  useEffect(() => {
    if (!postId) {
      setDraftContent('');
      createComment.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleSend = async () => {
    if (!requireLogin('comment')) return;
    const trimmed = draftContent.trim();
    if (!trimmed || createComment.isPending) return;
    try {
      await createComment.mutateAsync({ content: trimmed });
      setDraftContent('');
    } catch {
      // Error displayed inline
    }
  };

  const handleLike = (commentId: string, isLiked: boolean) => {
    if (!requireLogin('comment')) return;
    likeComment.mutate({ commentId, isLiked });
  };

  const handleDelete = (commentId: string) => {
    deleteComment.mutate(commentId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Sheet open={!!postId} onOpenChange={(v) => { if (!v) onClose(); }}>
        <SheetContent
          side={isDesktop ? 'right' : 'bottom'}
          className={
            isDesktop
              ? 'w-full max-w-md p-0 flex flex-col'
              : 'h-[85vh] p-0 flex flex-col rounded-t-2xl'
          }
        >
          <SheetHeader className="px-4 pt-4 pb-3 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              {t('comments')}
              {totalCount > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({totalCount})
                </span>
              )}
            </SheetTitle>
            {postContent && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {postContent}
              </p>
            )}
          </SheetHeader>

          {/* Comment list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {isLoading && (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && !isLoading && (
              <div className="flex flex-col items-center py-10 gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <p className="text-sm text-destructive">{tc('loadingFailed')}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  {tc('retry')}
                </Button>
              </div>
            )}

            {!isLoading && !error && comments.length === 0 && (
              <div className="flex flex-col items-center py-10">
                <MessageSquare className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {t('noComments')}
                </p>
              </div>
            )}

            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLike={handleLike}
                onDelete={handleDelete}
                isLikePending={likeComment.isPending}
                isDeletePending={
                  deleteComment.isPending &&
                  deleteComment.variables === comment.id
                }
              />
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="flex justify-center py-2">
              {isFetchingNextPage && (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t px-4 py-3 bg-background">
            <div className="flex items-end gap-2">
              <textarea
                id={inputId}
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('writeComment')}
                rows={2}
                maxLength={500}
                disabled={createComment.isPending}
                className="flex-1 resize-none rounded-lg border border-input bg-muted/40 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                aria-label={t('writeComment')}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!draftContent.trim() || createComment.isPending}
                aria-label={t('send')}
                className="shrink-0 mb-0.5"
              >
                {createComment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {createComment.isError && (
              <p className="mt-1 text-xs text-destructive">
                {createComment.error instanceof Error
                  ? createComment.error.message
                  : tc('retryLater')}
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {showLoginPrompt && (
        <LoginPrompt feature={promptFeature} onDismiss={dismissPrompt} />
      )}
    </>
  );
}

// ---- CommentItem ----

interface CommentItemProps {
  comment: AgoraComment;
  onLike: (commentId: string, isLiked: boolean) => void;
  onDelete: (commentId: string) => void;
  isLikePending: boolean;
  isDeletePending: boolean;
}

function CommentItem({
  comment,
  onLike,
  onDelete,
  isDeletePending,
}: CommentItemProps) {
  const tc = useTranslations('common');
  const t = useTranslations('community');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const relativeTimeT = {
    justNow: tc('justNow'),
    minutesAgo: (count: number) => tc('minutesAgo', { count }),
    hoursAgo: (count: number) => tc('hoursAgo', { count }),
    daysAgo: (count: number) => tc('daysAgo', { count }),
    weeksAgo: (count: number) => tc('weeksAgo', { count }),
    monthsAgo: (count: number) => tc('monthsAgo', { count }),
    yearsAgo: (count: number) => tc('yearsAgo', { count }),
  };

  const initials = comment.authorName
    ? comment.authorName.charAt(0).toUpperCase()
    : '?';

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      {comment.authorAvatar ? (
        <img
          src={comment.authorAvatar}
          alt={comment.authorName}
          className="h-8 w-8 rounded-full object-cover shrink-0 mt-0.5"
        />
      ) : (
        <div className="flex h-8 w-8 shrink-0 mt-0.5 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">
          {initials}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium truncate">{comment.authorName}</span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(comment.createdAt, relativeTimeT)}
          </span>
        </div>

        <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap break-words">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="mt-2 flex items-center gap-4">
          <button
            onClick={() => onLike(comment.id, !!comment.isLiked)}
            className={`flex items-center gap-1 text-xs transition-colors ${
              comment.isLiked
                ? 'text-red-500'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label={comment.isLiked ? 'Unlike' : 'Like'}
            aria-pressed={comment.isLiked}
          >
            <Heart
              className={`h-3.5 w-3.5 ${comment.isLiked ? 'fill-red-500' : ''}`}
            />
            {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
          </button>

          {comment.isAuthor && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              aria-label={t('deleteComment')}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t('deleteComment')}</span>
            </button>
          )}

          {comment.isAuthor && confirmDelete && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDelete(comment.id)}
                disabled={isDeletePending}
                className="text-xs text-destructive hover:underline disabled:opacity-50"
              >
                {isDeletePending ? (
                  <Loader2 className="h-3 w-3 animate-spin inline" />
                ) : (
                  t('confirmDelete')
                )}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-muted-foreground hover:underline"
              >
                {t('cancel')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
