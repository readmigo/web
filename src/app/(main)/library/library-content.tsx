'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { BookGrid } from '@/features/library/components/book-grid';
import { useUserLibrary } from '@/features/library/hooks/use-user-library';
import { useLibraryStore } from '@/features/library/stores/library-store';
import { Grid, List, Search, SlidersHorizontal, RefreshCw } from 'lucide-react';

export function LibraryContent() {
  const { viewMode, setViewMode, searchQuery, setSearchQuery, filterBy } =
    useLibraryStore();
  const { data: userBooks, isLoading, error, refetch } = useUserLibrary();

  // Filter books based on search query and status filter
  const filteredBooks = (userBooks || [])
    .filter((userBook) => {
      const book = userBook.book;
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterBy === 'all' || userBook.status === filterBy;
      return matchesSearch && matchesFilter;
    })
    .map((userBook) => ({
      ...userBook.book,
      progress: userBook.progress,
      status: userBook.status,
      userBookId: userBook.id,
    }));

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
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索书籍..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button variant="outline" size="icon">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>

        <div className="flex rounded-md border">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-r-none"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-l-none"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Books */}
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
      ) : filteredBooks.length > 0 ? (
        <BookGrid books={filteredBooks} showProgress />
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg text-muted-foreground">书架还是空的</p>
          <p className="mt-2 text-sm text-muted-foreground">
            去探索发现更多好书吧
          </p>
          <Button className="mt-4" asChild>
            <a href="/explore">探索书籍</a>
          </Button>
        </div>
      )}
    </div>
  );
}
