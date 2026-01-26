'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  PanelRightOpen,
  PanelRightClose,
  Loader2,
  Highlighter,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PdfViewer,
  usePaper,
  usePaperHighlights,
  usePaperAnnotations,
  usePaperStore,
} from '@/features/papers';
import { cn } from '@/lib/utils';

interface PaperReaderProps {
  paperId: string;
}

export function PaperReader({ paperId }: PaperReaderProps) {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const isAuthenticated = authStatus === 'authenticated';
  const {
    currentPage,
    setCurrentPage,
    scale,
    zoomIn,
    zoomOut,
    showSidebar,
    toggleSidebar,
    sidebarTab,
    setSidebarTab,
  } = usePaperStore();

  const { data: paper, isLoading: isPaperLoading } = usePaper(paperId);
  // Only fetch highlights/annotations for authenticated users
  const { data: highlights } = usePaperHighlights(isAuthenticated ? paperId : undefined);
  const { data: annotations } = usePaperAnnotations(isAuthenticated ? paperId : undefined);

  const [numPages, setNumPages] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else if (e.key === 'ArrowRight' && currentPage < numPages) {
        setCurrentPage(currentPage + 1);
      } else if (e.key === 'Escape') {
        router.push('/papers');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, numPages, setCurrentPage, router]);

  const handleDocumentLoad = useCallback(
    (pages: number) => {
      setNumPages(pages);
    },
    []
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
    },
    [setCurrentPage]
  );

  if (isPaperLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <p className="text-lg text-destructive">论文不存在</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push('/papers')}>
          返回论文库
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/papers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-medium">{paper.title}</h1>
            {paper.authors && (
              <p className="truncate text-xs text-muted-foreground">{paper.authors}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[80px] text-center text-sm">
              {currentPage} / {numPages || '-'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="min-w-[50px] text-center text-sm">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="ghost" size="icon" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Sidebar Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            {showSidebar ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto">
          <PdfViewer
            url={`${process.env.NEXT_PUBLIC_API_URL}/papers/${paperId}/pdf`}
            currentPage={currentPage}
            scale={scale}
            onPageChange={handlePageChange}
            onDocumentLoad={handleDocumentLoad}
            className="min-h-full py-4"
          />
        </div>

        {/* Sidebar */}
        <div
          className={cn(
            'w-80 shrink-0 border-l bg-background transition-all duration-300',
            showSidebar ? 'translate-x-0' : 'translate-x-full'
          )}
          style={{ marginRight: showSidebar ? 0 : -320 }}
        >
          <Tabs
            value={sidebarTab}
            onValueChange={(v) => setSidebarTab(v as 'highlights' | 'annotations')}
            className="flex h-full flex-col"
          >
            <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2">
              <TabsTrigger value="highlights" className="gap-2">
                <Highlighter className="h-4 w-4" />
                高亮
              </TabsTrigger>
              <TabsTrigger value="annotations" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                笔记
              </TabsTrigger>
            </TabsList>

            <TabsContent value="highlights" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-2 p-4">
                  {highlights && highlights.length > 0 ? (
                    highlights.map((highlight) => (
                      <div
                        key={highlight.id}
                        className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
                        onClick={() => handlePageChange(highlight.pageNumber)}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded"
                            style={{ backgroundColor: highlight.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            第 {highlight.pageNumber} 页
                          </span>
                        </div>
                        <p className="mt-2 text-sm line-clamp-3">{highlight.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Highlighter className="h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        还没有高亮
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        选中文字即可添加高亮
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="annotations" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-2 p-4">
                  {annotations && annotations.length > 0 ? (
                    annotations.map((annotation) => (
                      <div
                        key={annotation.id}
                        className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
                        onClick={() => handlePageChange(annotation.pageNumber)}
                      >
                        <span className="text-xs text-muted-foreground">
                          第 {annotation.pageNumber} 页
                        </span>
                        <p className="mt-2 text-sm line-clamp-4">
                          {annotation.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        还没有笔记
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        选中文字后可添加笔记
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
