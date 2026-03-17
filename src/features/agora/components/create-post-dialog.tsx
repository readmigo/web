'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PenLine, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { LoginPrompt } from '@/features/auth/components/login-prompt';
import { useRequireLogin } from '@/features/auth/hooks/use-require-login';
import { useCreatePost } from '../hooks/use-create-post';

const MAX_LENGTH = 500;

interface CreatePostDialogProps {
  /** Callback fired after a post is successfully published. */
  onSuccess?: () => void;
}

export function CreatePostDialog({ onSuccess }: CreatePostDialogProps) {
  const t = useTranslations('community');
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');

  const { requireLogin, showLoginPrompt, promptFeature, dismissPrompt } =
    useRequireLogin();

  const createPost = useCreatePost();

  const handleOpenAttempt = () => {
    if (!requireLogin('createPost')) return;
    setOpen(true);
  };

  const handleClose = () => {
    if (createPost.isPending) return;
    setOpen(false);
    setContent('');
    createPost.reset();
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || createPost.isPending) return;

    try {
      await createPost.mutateAsync({ content: trimmed });
      setOpen(false);
      setContent('');
      onSuccess?.();
    } catch {
      // Error is available via createPost.error; we show it inline
    }
  };

  const isOverLimit = content.length > MAX_LENGTH;
  const isEmpty = content.trim().length === 0;

  return (
    <>
      {/* Trigger button */}
      <Button
        onClick={handleOpenAttempt}
        size="sm"
        className="flex items-center gap-1.5"
        aria-label={t('createPost')}
      >
        <PenLine className="h-4 w-4" />
        <span className="hidden sm:inline">{t('createPost')}</span>
      </Button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent
          className="sm:max-w-md"
          aria-describedby="create-post-description"
        >
          <DialogHeader>
            <DialogTitle>{t('createPost')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <textarea
              id="create-post-description"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('postPlaceholder')}
              rows={5}
              maxLength={MAX_LENGTH + 1}
              disabled={createPost.isPending}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              aria-label={t('postContent')}
            />

            <div className="flex items-center justify-between text-xs">
              <span
                className={
                  isOverLimit ? 'text-destructive' : 'text-muted-foreground'
                }
              >
                {t('charCount', { count: content.length })}
              </span>
              {createPost.isError && (
                <span className="text-destructive text-xs">
                  {createPost.error instanceof Error
                    ? createPost.error.message
                    : 'Failed to publish'}
                </span>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={createPost.isPending}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isEmpty || isOverLimit || createPost.isPending}
            >
              {createPost.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('publishing')}
                </>
              ) : (
                t('publish')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login prompt */}
      {showLoginPrompt && (
        <LoginPrompt feature={promptFeature} onDismiss={dismissPrompt} />
      )}
    </>
  );
}
