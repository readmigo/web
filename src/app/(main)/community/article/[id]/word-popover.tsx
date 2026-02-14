'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Volume2, BookmarkPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api/index';

interface WordDefinition {
  pos: string;
  meaning: string;
}

interface WordLookupResponse {
  phonetic?: string;
  definitions?: WordDefinition[];
}

interface WordPopoverProps {
  word: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function WordPopover({ word, position, onClose }: WordPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  // 查询单词释义
  const { data, isLoading } = useQuery({
    queryKey: ['word-definition', word],
    queryFn: () => api.get<WordLookupResponse>(`/community/vocabulary/lookup/${word}`),
    enabled: !!word,
  });

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // 按ESC关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 计算弹窗位置
  const style = {
    position: 'fixed' as const,
    left: Math.min(position.x, window.innerWidth - 320),
    top: position.y + 20,
    zIndex: 100,
  };

  const playPronunciation = () => {
    const audio = new Audio(
      `https://dict.youdao.com/dictvoice?audio=${word}&type=1`
    );
    audio.play();
  };

  const addToVocabulary = async () => {
    // TODO: Implement vocabulary saving feature
    console.log('Adding word to vocabulary:', word);
  };

  return (
    <Card ref={ref} className="w-80 p-4 shadow-lg" style={style}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-bold text-lg">{word}</h3>
          {data?.phonetic && (
            <p className="text-sm text-muted-foreground">
              /{data.phonetic}/
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={playPronunciation}>
            <Volume2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : (data?.definitions?.length ?? 0) > 0 ? (
        <div className="space-y-2">
          {data!.definitions!.slice(0, 3).map((def: WordDefinition, i: number) => (
            <div key={i} className="text-sm">
              <span className="text-muted-foreground">{def.pos}.</span>{' '}
              {def.meaning}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">暂无释义</p>
      )}

      <div className="mt-4 pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={addToVocabulary}
        >
          <BookmarkPlus className="h-4 w-4 mr-2" />
          添加到词汇本
        </Button>
      </div>
    </Card>
  );
}
