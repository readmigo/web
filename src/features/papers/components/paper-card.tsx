'use client';

import Link from 'next/link';
import { FileText, MoreVertical, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Paper } from '../types';

interface PaperCardProps {
  paper: Paper;
  onDelete?: (id: string) => void;
  className?: string;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}

export function PaperCard({ paper, onDelete, className }: PaperCardProps) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-shadow hover:shadow-md',
        className
      )}
    >
      <Link href={`/papers/${paper.id}`} className="block">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 font-medium leading-tight">
                {paper.title}
              </h3>
              {paper.authors && (
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {paper.authors}
                </p>
              )}
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                {paper.pageCount && <span>{paper.pageCount} 页</span>}
                <span>{formatFileSize(paper.fileSize)}</span>
                <span>{formatDate(paper.createdAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>

      {onDelete && (
        <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.preventDefault()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(paper.id);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </Card>
  );
}
