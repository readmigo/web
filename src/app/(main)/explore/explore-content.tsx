'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookGrid } from '@/features/library/components/book-grid';
import { useBooks } from '@/features/library/hooks/use-books';
import { Search, RefreshCw } from 'lucide-react';

const categories = [
  { label: '全部', value: '' },
  { label: '小说', value: 'fiction' },
  { label: '经典文学', value: 'classics' },
  { label: '科幻', value: 'science-fiction' },
  { label: '历史', value: 'history' },
  { label: '哲学', value: 'philosophy' },
  { label: '传记', value: 'biography' },
  { label: '科学', value: 'science' },
];

const difficulties = [
  { label: '全部难度', value: 0 },
  { label: 'Beginner', value: 1 },
  { label: 'Elementary', value: 2 },
  { label: 'Intermediate', value: 3 },
  { label: 'Advanced', value: 4 },
  { label: 'Expert', value: 5 },
];

export function ExploreContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, error, refetch } = useBooks({
    category: selectedCategory || undefined,
    difficulty: selectedDifficulty || undefined,
    search: debouncedSearch || undefined,
    limit: 50,
  });

  const books = data?.data || [];
  const total = data?.total || 0;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-destructive">加载失败</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : '请稍后重试'}
        </p>
        <Button className="mt-4" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索书名或作者..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-lg"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Badge
            key={category.value}
            variant={selectedCategory === category.value ? 'default' : 'outline'}
            className="cursor-pointer px-3 py-1"
            onClick={() => setSelectedCategory(category.value)}
          >
            {category.label}
          </Badge>
        ))}
      </div>

      {/* Difficulty filter */}
      <div className="flex flex-wrap gap-2">
        {difficulties.map((diff) => (
          <Button
            key={diff.value}
            variant={selectedDifficulty === diff.value ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedDifficulty(diff.value)}
          >
            {diff.label}
          </Button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {isLoading ? '搜索中...' : `找到 ${total} 本书籍`}
      </p>

      {/* Books grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <BookGrid books={books} />
      )}
    </div>
  );
}
