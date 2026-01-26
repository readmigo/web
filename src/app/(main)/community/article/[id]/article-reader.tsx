'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import DOMPurify from 'isomorphic-dompurify';
import { ArrowLeft, ExternalLink, Share2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { WordPopover } from './word-popover';
import { api } from '@/lib/api/index';

interface ArticleReaderProps {
  articleId: string;
}

const categoryLabels: Record<string, string> = {
  TECH: '科技',
  BUSINESS: '商业',
  CULTURE: '文化',
  LITERATURE: '文学',
};

export function ArticleReader({ articleId }: ArticleReaderProps) {
  const router = useRouter();
  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    position: { x: number; y: number };
  } | null>(null);

  // Fetch article
  const { data: article, isLoading } = useQuery({
    queryKey: ['community-article', articleId],
    queryFn: () => api.get(`/community/articles/${articleId}`),
  });

  // Update reading progress
  const updateProgress = useMutation({
    mutationFn: (progress: number) =>
      api.post(`/community/history/${articleId}/progress`, {
        progress,
      }),
  });

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(100, Math.round((scrollTop / docHeight) * 100));

      // Debounce progress updates
      if (progress % 10 === 0) {
        updateProgress.mutate(progress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [updateProgress]);

  // Handle word click for vocabulary lookup
  const handleWordClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'SPAN' && target.dataset.word) {
      const word = target.dataset.word;
      const rect = target.getBoundingClientRect();
      setSelectedWord({
        word,
        position: { x: rect.left, y: rect.bottom },
      });
    }
  }, []);

  // Close word popover
  const closePopover = useCallback(() => {
    setSelectedWord(null);
  }, []);

  // Process content to make words clickable
  const processContent = (html: string): string => {
    // First sanitize the HTML
    const clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'strong', 'em', 'br', 'img'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
    });

    // Then wrap English words in spans for click handling
    return clean.replace(
      /\b([a-zA-Z]+(?:'[a-zA-Z]+)?)\b/g,
      '<span class="cursor-pointer hover:bg-primary/10 rounded px-0.5 transition-colors" data-word="$1">$1</span>'
    );
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: article?.data?.title,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  const articleData = article?.data;

  if (!articleData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">文章不存在</p>
        <Link href="/community">
          <Button variant="link">返回社区</Button>
        </Link>
      </div>
    );
  }

  const canReadInSite =
    articleData.license === 'CC' || articleData.license === 'PUBLIC_DOMAIN';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>

        <h1 className="text-2xl font-bold mb-4">{articleData.title}</h1>

        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary">
            {categoryLabels[articleData.category] || articleData.category}
          </Badge>
          {articleData.source?.name && (
            <span className="text-sm text-muted-foreground">
              {articleData.source.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={articleData.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              查看原文
            </Button>
          </a>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            分享
          </Button>
        </div>
      </div>

      {/* Content */}
      {canReadInSite && articleData.content ? (
        <div
          className="prose prose-slate dark:prose-invert max-w-none"
          onClick={handleWordClick}
          dangerouslySetInnerHTML={{
            __html: processContent(articleData.content),
          }}
        />
      ) : (
        <div className="bg-muted/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              由于版权限制，仅展示摘要
            </span>
          </div>
          <p className="text-muted-foreground mb-4">{articleData.summary}</p>
          <a
            href={articleData.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button>
              <ExternalLink className="h-4 w-4 mr-2" />
              阅读完整文章
            </Button>
          </a>
        </div>
      )}

      {/* Word Popover */}
      {selectedWord && (
        <WordPopover
          word={selectedWord.word}
          position={selectedWord.position}
          onClose={closePopover}
        />
      )}
    </div>
  );
}
