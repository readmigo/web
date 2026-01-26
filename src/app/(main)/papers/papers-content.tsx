'use client';

import { useState } from 'react';
import { Search, Grid, List, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  PaperGrid,
  usePapers,
  useDeletePaper,
  usePaperStore,
} from '@/features/papers';

export function PapersContent() {
  const { viewMode, setViewMode, searchQuery, setSearchQuery } = usePaperStore();
  const { data: papersData, isLoading, error, refetch } = usePapers();
  const deleteMutation = useDeletePaper();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paperToDelete, setPaperToDelete] = useState<string | null>(null);

  // Filter papers based on search query
  const papers = papersData?.items || [];
  const filteredPapers = papers.filter((paper) => {
    const matchesSearch =
      paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (paper.authors?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesSearch;
  });

  const handleDeleteClick = (paperId: string) => {
    setPaperToDelete(paperId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (paperToDelete) {
      await deleteMutation.mutateAsync(paperToDelete);
      setPaperToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

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
            placeholder="搜索论文..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

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

      {/* Papers */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPapers.length > 0 ? (
        <PaperGrid papers={filteredPapers} onDelete={handleDeleteClick} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg text-muted-foreground">还没有论文</p>
          <p className="mt-2 text-sm text-muted-foreground">
            公版论文将由系统自动导入
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，确定要删除这篇论文吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
