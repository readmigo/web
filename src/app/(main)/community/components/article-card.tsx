'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ExternalLink, Share2 } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Article {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  originalUrl: string;
  category: string;
  license: string;
  publishedAt: string;
  source?: { name: string };
}

const categoryLabels: Record<string, string> = {
  TECH: '科技',
  BUSINESS: '商业',
  CULTURE: '文化',
  LITERATURE: '文学',
};

const licenseLabels: Record<string, string> = {
  CC: '可阅读',
  PUBLIC_DOMAIN: '可阅读',
  EDUCATIONAL: '摘要',
  REDIRECT_ONLY: '跳转',
};

export function ArticleCard({ article }: { article: Article }) {
  const canReadInSite =
    article.license === 'CC' || article.license === 'PUBLIC_DOMAIN';

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: article.title,
        url: article.originalUrl,
      });
    } else {
      await navigator.clipboard.writeText(article.originalUrl);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {article.imageUrl && (
        <div className="relative h-40 bg-muted">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">
            {categoryLabels[article.category] || article.category}
          </Badge>
          <Badge variant={canReadInSite ? 'default' : 'outline'}>
            {licenseLabels[article.license] || article.license}
          </Badge>
        </div>

        {canReadInSite ? (
          <Link href={`/community/article/${article.id}`}>
            <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
              {article.title}
            </h3>
          </Link>
        ) : (
          <a
            href={article.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors flex items-center gap-1">
              {article.title}
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
          </a>
        )}

        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
          {article.summary}
        </p>
      </CardContent>

      <CardFooter className="px-4 py-3 border-t flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {article.source?.name && <span>{article.source.name} · </span>}
          {article.publishedAt &&
            formatDistanceToNow(new Date(article.publishedAt), {
              addSuffix: true,
              locale: zhCN,
            })}
        </div>
        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
