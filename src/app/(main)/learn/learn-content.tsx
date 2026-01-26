'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FlashCard } from '@/features/learning/components/flashcard';
import { LearningStats } from '@/features/learning/components/learning-stats';
import { useLearningStore } from '@/features/learning/stores/learning-store';
import { Play, BookOpen, RotateCcw, Trophy } from 'lucide-react';
import type { ReviewQuality } from '@/features/learning/types';
import Link from 'next/link';

export function LearnContent() {
  const {
    currentSession,
    startReviewSession,
    submitReview,
    nextCard,
    endSession,
    getDueCards,
    getStats,
  } = useLearningStore();

  const stats = getStats();
  const dueCards = getDueCards();

  const handleReview = (quality: ReviewQuality) => {
    if (!currentSession) return;
    const currentCard = currentSession.cards[currentSession.currentIndex];
    submitReview(currentCard.id, quality);
    nextCard();
  };

  // Active review session
  if (currentSession) {
    const { cards, currentIndex, correctCount } = currentSession;
    const progress = ((currentIndex + 1) / cards.length) * 100;
    const currentCard = cards[currentIndex];

    if (!currentCard) {
      // Session complete
      return (
        <div className="mx-auto max-w-md text-center py-12">
          <div className="mb-6">
            <Trophy className="mx-auto h-16 w-16 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold">复习完成!</h2>
          <p className="mt-2 text-muted-foreground">
            你完成了 {cards.length} 个单词的复习
          </p>
          <div className="mt-6 rounded-lg bg-muted p-6">
            <div className="text-4xl font-bold text-primary">
              {Math.round((correctCount / cards.length) * 100)}%
            </div>
            <div className="mt-1 text-sm text-muted-foreground">正确率</div>
          </div>
          <div className="mt-8 flex gap-4 justify-center">
            <Button onClick={startReviewSession}>
              <RotateCcw className="mr-2 h-4 w-4" />
              再来一轮
            </Button>
            <Button variant="outline" onClick={endSession}>
              返回
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-md">
        {/* Progress */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {currentIndex + 1} / {cards.length}
            </span>
            <span className="text-muted-foreground">
              正确: {correctCount}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Flashcard */}
        <FlashCard card={currentCard} onReview={handleReview} />

        {/* Exit button */}
        <Button
          variant="ghost"
          className="mt-6 w-full"
          onClick={endSession}
        >
          退出复习
        </Button>
      </div>
    );
  }

  // Default view - stats and start button
  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-lg font-semibold">今日待复习</h3>
              <p className="text-3xl font-bold text-primary">
                {stats.reviewsDueToday}
              </p>
              <p className="text-sm text-muted-foreground">个单词</p>
            </div>
            <Button
              size="lg"
              disabled={stats.reviewsDueToday === 0}
              onClick={startReviewSession}
            >
              <Play className="mr-2 h-4 w-4" />
              开始复习
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-lg font-semibold">生词本</h3>
              <p className="text-3xl font-bold">{stats.totalWords}</p>
              <p className="text-sm text-muted-foreground">个单词</p>
            </div>
            <Button size="lg" variant="outline" asChild>
              <Link href="/vocabulary">
                <BookOpen className="mr-2 h-4 w-4" />
                查看生词
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <LearningStats />

      {/* Empty state if no words */}
      {stats.totalWords === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">开始你的学习之旅</h3>
            <p className="mt-2 text-center text-muted-foreground">
              阅读书籍时点击不认识的单词，将其添加到生词本
            </p>
            <Button className="mt-6" asChild>
              <Link href="/explore">探索书籍</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
