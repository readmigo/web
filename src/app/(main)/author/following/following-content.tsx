'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  BookOpen,
  UserMinus,
  Users,
  Loader2,
} from 'lucide-react';
import type { AuthorListItem } from '@/features/author';
import { authorKeys } from '@/features/author';

interface FollowingAuthorsResponse {
  authors: AuthorListItem[];
  total: number;
}

function useFollowingAuthors() {
  return useQuery({
    queryKey: [...authorKeys.lists(), 'following'],
    queryFn: () =>
      apiClient.get<FollowingAuthorsResponse>('/authors/following', {
        noRedirectOn401: true,
      }),
    staleTime: 2 * 60 * 1000,
  });
}

function useUnfollowAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (authorId: string) =>
      apiClient.delete(`/authors/${authorId}/follow`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...authorKeys.lists(), 'following'] });
    },
  });
}

// ---- AuthorRow ----

function AuthorRow({ author }: { author: AuthorListItem }) {
  const t = useTranslations('author');
  const tFollowing = useTranslations('author.following');
  const unfollowMutation = useUnfollowAuthor();
  const initials = author.name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-sm">
      <Link href={`/author/${author.id}`} className="flex-shrink-0">
        <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted">
          {author.avatarUrl ? (
            <Image
              src={author.avatarUrl}
              alt={author.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-lg font-medium text-muted-foreground">
              {initials}
            </div>
          )}
        </div>
      </Link>

      <Link href={`/author/${author.id}`} className="min-w-0 flex-1">
        <p className="truncate font-medium">{author.name}</p>
        {author.nameZh && (
          <p className="truncate text-sm text-muted-foreground">{author.nameZh}</p>
        )}
        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <BookOpen className="h-3 w-3" />
          <span>{tFollowing('bookCount', { count: author.bookCount })}</span>
          {author.era && <span className="ml-1">{author.era}</span>}
        </div>
      </Link>

      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5 text-xs text-muted-foreground"
        disabled={unfollowMutation.isPending}
        onClick={() => unfollowMutation.mutate(author.id)}
        aria-label={t('unfollow')}
      >
        {unfollowMutation.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <UserMinus className="h-3 w-3" />
        )}
        {tFollowing('unfollow')}
      </Button>
    </div>
  );
}

// ---- Skeleton ----

function AuthorRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-sm">
      <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-8 w-20 rounded-md" />
    </div>
  );
}

// ---- Main Component ----

export function FollowingAuthorsContent() {
  const tFollowing = useTranslations('author.following');
  const tc = useTranslations('common');

  const { data, isLoading, error, refetch } = useFollowingAuthors();
  const authors = data?.authors ?? [];

  return (
    <div className="container max-w-2xl py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold">{tFollowing('title')}</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground">
              {tFollowing('count', { count: data?.total ?? 0 })}
            </p>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <AuthorRowSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
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
      )}

      {/* Empty */}
      {!isLoading && !error && authors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Users className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">{tFollowing('emptyTitle')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{tFollowing('emptyDesc')}</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/author">{tFollowing('exploreAuthors')}</Link>
          </Button>
        </div>
      )}

      {/* Author List */}
      {!isLoading && !error && authors.length > 0 && (
        <div className="space-y-3">
          {authors.map((author) => (
            <AuthorRow key={author.id} author={author} />
          ))}
        </div>
      )}
    </div>
  );
}
