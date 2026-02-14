'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  Clock,
  FileText,
  Plus,
  Check,
  ChevronRight,
  Star,
  Headphones,
  Share2,
  User,
} from 'lucide-react';
import { useBookDetail } from '@/features/library/hooks/use-books';

const difficultyLabels: Record<number, string> = {
  1: 'Beginner',
  2: 'Elementary',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

const difficultyColors: Record<number, string> = {
  1: 'bg-green-500',
  2: 'bg-blue-500',
  3: 'bg-yellow-500',
  4: 'bg-orange-500',
  5: 'bg-red-500',
};

interface BookDetailContentProps {
  bookId: string;
}

export function BookDetailContent({ bookId }: BookDetailContentProps) {
  const [isInLibrary, setIsInLibrary] = useState(false);
  const { data: book, isLoading, error } = useBookDetail(bookId);

  if (isLoading) {
    return <BookDetailSkeleton />;
  }

  if (error || !book) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">
          {error ? '加载书籍详情失败，请稍后重试' : '未找到该书籍'}
        </p>
      </div>
    );
  }

  const formatReadTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours} 小时` : `${minutes} 分钟`;
  };

  const formatWordCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}k`;
    }
    return count.toString();
  };

  return (
    <div className="container py-6">
      {/* Book Header */}
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Cover */}
        <div className="flex-shrink-0">
          <div className="relative aspect-[2/3] w-48 overflow-hidden rounded-lg bg-muted shadow-lg md:w-64">
            <div className="flex h-full items-center justify-center">
              <span className="text-6xl">📚</span>
            </div>
            <Badge
              className={`absolute left-2 top-2 ${difficultyColors[book.difficulty]}`}
            >
              {difficultyLabels[book.difficulty]}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold">{book.title}</h1>
            {book.authorId ? (
              <Link
                href={`/author/${book.authorId}`}
                className="mt-1 inline-flex items-center gap-1 text-lg text-muted-foreground transition-colors hover:text-primary"
              >
                <User className="h-4 w-4" />
                <span>{book.author}</span>
                {book.authorZh && (
                  <span className="text-base">({book.authorZh})</span>
                )}
              </Link>
            ) : (
              <p className="mt-1 text-lg text-muted-foreground">{book.author}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{formatWordCount(book.wordCount)} 词</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>约 {formatReadTime(book.estimatedReadTime)}</span>
            </div>
            {book.publishYear && (
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{book.publishYear}年</span>
              </div>
            )}
            {book.aiScore && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{book.aiScore}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {book.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" asChild>
              <Link href={`/read/${book.id}`}>
                <BookOpen className="mr-2 h-4 w-4" />
                开始阅读
              </Link>
            </Button>
            <Button
              size="lg"
              variant={isInLibrary ? 'secondary' : 'outline'}
              onClick={() => setIsInLibrary(!isInLibrary)}
            >
              {isInLibrary ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  已加入书架
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  加入书架
                </>
              )}
            </Button>
            <Button size="lg" variant="outline">
              <Headphones className="mr-2 h-4 w-4" />
              有声书
            </Button>
            <Button size="icon" variant="ghost">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-semibold">简介</h2>
              <p className="leading-relaxed text-muted-foreground">
                {book.description}
              </p>
            </CardContent>
          </Card>

          {/* Chapters */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-semibold">
                目录 ({book.chapters.length} 章)
              </h2>
              <div className="space-y-2">
                {book.chapters.slice(0, 10).map((chapter) => (
                  <Link
                    key={chapter.id}
                    href={`/read/${book.id}?chapter=${chapter.id}`}
                    className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted"
                  >
                    <span className="text-sm">{chapter.title}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
                {book.chapters.length > 10 && (
                  <Button variant="ghost" className="w-full">
                    查看全部 {book.chapters.length} 章
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reading Progress */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-semibold">阅读进度</h2>
              <div className="space-y-3">
                <Progress value={0} className="h-2" />
                <p className="text-sm text-muted-foreground">尚未开始阅读</p>
              </div>
            </CardContent>
          </Card>

          {/* Book Info */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-semibold">书籍信息</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">语言</dt>
                  <dd>English</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">分类</dt>
                  <dd>{book.category}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">来源</dt>
                  <dd className="capitalize">{book.source.replace('-', ' ')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">难度</dt>
                  <dd>{difficultyLabels[book.difficulty]}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BookDetailSkeleton() {
  return (
    <div className="container py-6">
      <div className="flex flex-col gap-8 md:flex-row">
        <Skeleton className="aspect-[2/3] w-48 rounded-lg md:w-64" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-11 w-32" />
            <Skeleton className="h-11 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
