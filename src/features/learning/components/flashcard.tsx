'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, RotateCcw } from 'lucide-react';
import type { FlashCard as FlashCardType, ReviewQuality } from '../types';
import { cn } from '@/lib/utils';

interface FlashCardProps {
  card: FlashCardType;
  onReview: (quality: ReviewQuality) => void;
}

export function FlashCard({ card, onReview }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { word } = card;

  const handleSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  };

  const qualityButtons: Array<{
    quality: ReviewQuality;
    label: string;
    color: string;
  }> = [
    { quality: 0, label: '完全不会', color: 'bg-red-500 hover:bg-red-600' },
    { quality: 1, label: '不记得', color: 'bg-orange-500 hover:bg-orange-600' },
    { quality: 3, label: '有点难', color: 'bg-yellow-500 hover:bg-yellow-600' },
    { quality: 4, label: '记住了', color: 'bg-green-500 hover:bg-green-600' },
    { quality: 5, label: '太简单', color: 'bg-blue-500 hover:bg-blue-600' },
  ];

  return (
    <div className="mx-auto max-w-md">
      <Card
        className={cn(
          'cursor-pointer transition-all duration-300',
          isFlipped && 'ring-2 ring-primary'
        )}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center p-8">
          {!isFlipped ? (
            // Front - Word
            <div className="text-center">
              <h2 className="text-4xl font-bold">{word.word}</h2>
              {word.phonetic && (
                <p className="mt-2 text-lg text-muted-foreground">
                  {word.phonetic}
                </p>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="mt-4"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak();
                }}
              >
                <Volume2 className="h-5 w-5" />
              </Button>
              <p className="mt-6 text-sm text-muted-foreground">
                点击卡片查看释义
              </p>
            </div>
          ) : (
            // Back - Definition
            <div className="w-full text-center">
              <Badge className="mb-4">{word.partOfSpeech}</Badge>
              <p className="text-lg">{word.definition}</p>
              <p className="mt-4 text-xl font-semibold text-primary">
                {word.translation}
              </p>
              {word.examples.length > 0 && (
                <div className="mt-4 text-left">
                  <p className="text-sm text-muted-foreground">例句:</p>
                  <p className="mt-1 text-sm italic">{word.examples[0]}</p>
                </div>
              )}
              {word.context && (
                <div className="mt-4 rounded-lg bg-muted p-3 text-left">
                  <p className="text-xs text-muted-foreground">原文语境:</p>
                  <p className="mt-1 text-sm italic">"{word.context}"</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {isFlipped && (
        <div className="mt-6 space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            你记住这个单词了吗？
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {qualityButtons.map(({ quality, label, color }) => (
              <Button
                key={quality}
                className={cn('text-white', color)}
                onClick={() => onReview(quality)}
              >
                {label}
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setIsFlipped(false)}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            翻回正面
          </Button>
        </div>
      )}
    </div>
  );
}
