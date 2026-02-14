'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import type { MobiMetadata } from '../../utils/mobi-parser';

interface MobiMetadataPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metadata: MobiMetadata | undefined;
  chapterCount: number;
}

export function MobiMetadataPanel({
  open,
  onOpenChange,
  metadata,
  chapterCount,
}: MobiMetadataPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <BookOpen className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Book Information</SheetTitle>
          <SheetDescription>MOBI metadata</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Title</label>
            <p className="text-sm">{metadata?.title || 'Unknown'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Author</label>
            <p className="text-sm">{metadata?.author || 'Unknown'}</p>
          </div>
          {metadata?.publisher && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Publisher</label>
              <p className="text-sm">{metadata.publisher}</p>
            </div>
          )}
          {metadata?.isbn && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">ISBN</label>
              <p className="text-sm">{metadata.isbn}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Language</label>
            <p className="text-sm">{metadata?.language || 'en'}</p>
          </div>
          {metadata?.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm">{metadata.description}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Chapters</label>
            <p className="text-sm">{chapterCount}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
