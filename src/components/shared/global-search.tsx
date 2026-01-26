'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  BookOpen,
  GraduationCap,
  Settings,
  BarChart3,
  Library,
  Compass,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useLearningStore } from '@/features/learning/stores/learning-store';

interface SearchResult {
  id: string;
  type: 'page' | 'book' | 'vocabulary' | 'action';
  title: string;
  description?: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { vocabulary } = useLearningStore();

  // Static navigation items
  const navigationItems: SearchResult[] = useMemo(
    () => [
      {
        id: 'home',
        type: 'page',
        title: '首页',
        description: '返回首页',
        icon: <Compass className="h-4 w-4" />,
        href: '/',
      },
      {
        id: 'library',
        type: 'page',
        title: '书库',
        description: '浏览和管理你的书籍',
        icon: <Library className="h-4 w-4" />,
        href: '/library',
      },
      {
        id: 'explore',
        type: 'page',
        title: '发现',
        description: '探索新书籍',
        icon: <Compass className="h-4 w-4" />,
        href: '/explore',
      },
      {
        id: 'vocabulary',
        type: 'page',
        title: '生词本',
        description: '管理和复习词汇',
        icon: <GraduationCap className="h-4 w-4" />,
        href: '/vocabulary',
      },
      {
        id: 'learn',
        type: 'page',
        title: '学习中心',
        description: '查看学习统计和进度',
        icon: <BarChart3 className="h-4 w-4" />,
        href: '/learn',
      },
      {
        id: 'settings',
        type: 'page',
        title: '设置',
        description: '管理应用设置',
        icon: <Settings className="h-4 w-4" />,
        href: '/settings',
      },
    ],
    []
  );

  // Filter results based on query
  const results = useMemo(() => {
    if (!query.trim()) {
      return [
        {
          id: 'recent-header',
          type: 'action' as const,
          title: '快速导航',
          icon: <Clock className="h-4 w-4" />,
        },
        ...navigationItems.slice(0, 5),
      ];
    }

    const lowerQuery = query.toLowerCase();
    const filtered: SearchResult[] = [];

    // Search navigation items
    navigationItems.forEach((item) => {
      if (
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery)
      ) {
        filtered.push(item);
      }
    });

    // Search vocabulary
    vocabulary.forEach((word) => {
      if (
        word.word.toLowerCase().includes(lowerQuery) ||
        word.translation.includes(query)
      ) {
        filtered.push({
          id: `vocab-${word.id}`,
          type: 'vocabulary',
          title: word.word,
          description: word.translation,
          icon: <FileText className="h-4 w-4" />,
          href: '/vocabulary',
        });
      }
    });

    return filtered.slice(0, 10);
  }, [query, navigationItems, vocabulary]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          const selected = results[selectedIndex];
          if (selected) {
            handleSelect(selected);
          }
          break;
        case 'Escape':
          onOpenChange(false);
          break;
      }
    },
    [results, selectedIndex, onOpenChange]
  );

  const handleSelect = (result: SearchResult) => {
    if (result.action) {
      result.action();
    } else if (result.href) {
      router.push(result.href);
    }
    onOpenChange(false);
    setQuery('');
  };

  // Global keyboard shortcut to open search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索页面、书籍、词汇..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          <kbd className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[400px]">
          <div className="p-2">
            {results.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Search className="mx-auto h-8 w-8 opacity-50" />
                <p className="mt-2">未找到结果</p>
                <p className="text-sm">尝试其他关键词</p>
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((result, index) => {
                  if (result.id === 'recent-header') {
                    return (
                      <div
                        key={result.id}
                        className="px-2 py-1.5 text-xs font-medium text-muted-foreground"
                      >
                        {result.title}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={result.id}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                        index === selectedIndex
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        {result.icon}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.title}</span>
                          {result.type === 'vocabulary' && (
                            <Badge variant="secondary" className="text-xs">
                              词汇
                            </Badge>
                          )}
                        </div>
                        {'description' in result && result.description && (
                          <p className="truncate text-sm text-muted-foreground">
                            {result.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>↑↓ 导航</span>
            <span>↵ 选择</span>
            <span>ESC 关闭</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="rounded bg-muted px-1.5 py-0.5">⌘</kbd>
            <span>+</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5">K</kbd>
            <span>打开搜索</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
