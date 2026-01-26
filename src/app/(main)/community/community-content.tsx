'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArticleCard } from './components/article-card';
import { ArticleCardSkeleton } from './components/article-card-skeleton';
import { api } from '@/lib/api/index';

const categories = [
  { id: 'all', label: '全部' },
  { id: 'TECH', label: '科技' },
  { id: 'BUSINESS', label: '商业' },
  { id: 'CULTURE', label: '文化' },
  { id: 'LITERATURE', label: '文学' },
];

export function CommunityContent() {
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['community-articles', category, page],
    queryFn: () =>
      api.get('/community/articles', {
        params: {
          category: category === 'all' ? undefined : category,
          page,
          limit: 20,
        },
      }),
  });

  return (
    <div className="space-y-6">
      <Tabs value={category} onValueChange={setCategory}>
        <TabsList>
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      ) : data?.items?.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((article: any) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">暂无文章</p>
          <p className="text-sm mt-2">稍后再来看看吧</p>
        </div>
      )}

      {data?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded border disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-4 py-2">
            {page} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= data.totalPages}
            className="px-4 py-2 rounded border disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
