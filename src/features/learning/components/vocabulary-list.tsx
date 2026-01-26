'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Volume2,
  Trash2,
  BookOpen,
  Filter,
} from 'lucide-react';
import { useLearningStore } from '../stores/learning-store';
import type { VocabularyWord } from '../types';

const masteryLabels = ['新词', '初学', '学习中', '熟悉', '掌握', '精通'];
const masteryColors = [
  'bg-gray-500',
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-green-500',
  'bg-blue-500',
];

interface VocabularyListProps {
  onWordClick?: (word: VocabularyWord) => void;
}

export function VocabularyList({ onWordClick }: VocabularyListProps) {
  const { vocabulary, removeWord } = useLearningStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMastery, setFilterMastery] = useState<number | null>(null);

  const filteredWords = vocabulary.filter((word) => {
    const matchesSearch =
      word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.translation.includes(searchQuery);
    const matchesMastery =
      filterMastery === null || word.masteryLevel === filterMastery;
    return matchesSearch && matchesMastery;
  });

  const handleSpeak = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索单词..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Mastery Filter */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={filterMastery === null ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilterMastery(null)}
        >
          全部 ({vocabulary.length})
        </Badge>
        {masteryLabels.map((label, level) => {
          const count = vocabulary.filter((w) => w.masteryLevel === level).length;
          return (
            <Badge
              key={level}
              variant={filterMastery === level ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterMastery(level)}
            >
              {label} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Word List */}
      {filteredWords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">
            {vocabulary.length === 0 ? '生词本是空的' : '没有找到匹配的单词'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            阅读时点击单词添加到生词本
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredWords.map((word) => (
            <Card
              key={word.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => onWordClick?.(word)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Badge className={masteryColors[word.masteryLevel]}>
                    {masteryLabels[word.masteryLevel]}
                  </Badge>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{word.word}</span>
                      <Badge variant="outline" className="text-xs">
                        {word.partOfSpeech}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {word.translation}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeak(word.word);
                    }}
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeWord(word.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
