'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Brain,
  Target,
  Flame,
  Calendar,
  Play,
  BarChart3,
  List,
  GraduationCap,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { VocabularyList } from '@/features/learning/components/vocabulary-list';
import { FlashCard } from '@/features/learning/components/flashcard';
import { useLearningStore } from '@/features/learning/stores/learning-store';
import type { ReviewQuality } from '@/features/learning/types';

export function VocabularyContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const {
    vocabulary,
    currentSession,
    getStats,
    getDueCards,
    startReviewSession,
    submitReview,
    nextCard,
    endSession,
  } = useLearningStore();

  const stats = getStats();
  const dueCards = getDueCards();

  const masteryPercentage =
    stats.totalWords > 0
      ? Math.round((stats.masteredWords / stats.totalWords) * 100)
      : 0;

  const handleStartReview = () => {
    startReviewSession();
    setActiveTab('review');
  };

  const handleReview = (quality: ReviewQuality) => {
    if (!currentSession) return;
    const currentCard = currentSession.cards[currentSession.currentIndex];
    submitReview(currentCard.id, quality);
    nextCard();
  };

  const currentCard = currentSession?.cards[currentSession.currentIndex];
  const sessionProgress = currentSession
    ? Math.round(
        ((currentSession.currentIndex + 1) / currentSession.cards.length) * 100
      )
    : 0;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="dashboard" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          仪表盘
        </TabsTrigger>
        <TabsTrigger value="words" className="flex items-center gap-2">
          <List className="h-4 w-4" />
          生词本
        </TabsTrigger>
        <TabsTrigger value="review" className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          复习
        </TabsTrigger>
      </TabsList>

      {/* Dashboard Tab */}
      <TabsContent value="dashboard" className="space-y-6">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">总词汇量</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWords}</div>
              <p className="text-xs text-muted-foreground">
                新增 +{stats.newWords} 个新词
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">待复习</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {stats.reviewsDueToday}
              </div>
              <p className="text-xs text-muted-foreground">
                预计 {Math.ceil(stats.reviewsDueToday * 0.5)} 分钟
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">已掌握</CardTitle>
              <Brain className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {stats.masteredWords}
              </div>
              <p className="text-xs text-muted-foreground">
                {masteryPercentage}% 掌握率
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">连续学习</CardTitle>
              <Flame className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {stats.streakDays}
              </div>
              <p className="text-xs text-muted-foreground">天</p>
            </CardContent>
          </Card>
        </div>

        {/* Review CTA */}
        {stats.reviewsDueToday > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-orange-500 p-3">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">今日复习任务</h3>
                  <p className="text-sm text-muted-foreground">
                    你有 {stats.reviewsDueToday} 个单词需要复习
                  </p>
                </div>
              </div>
              <Button onClick={handleStartReview} className="gap-2">
                <Play className="h-4 w-4" />
                开始复习
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>学习进度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>掌握进度</span>
                <span className="font-medium">{masteryPercentage}%</span>
              </div>
              <Progress value={masteryPercentage} className="h-3" />
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[
                { label: '新词', count: stats.newWords, color: 'bg-gray-500' },
                {
                  label: '初学',
                  count: vocabulary.filter((w) => w.masteryLevel === 1).length,
                  color: 'bg-red-500',
                },
                {
                  label: '学习中',
                  count: vocabulary.filter((w) => w.masteryLevel === 2).length,
                  color: 'bg-orange-500',
                },
                {
                  label: '熟悉',
                  count: vocabulary.filter((w) => w.masteryLevel === 3).length,
                  color: 'bg-yellow-500',
                },
                {
                  label: '掌握',
                  count: vocabulary.filter((w) => w.masteryLevel >= 4).length,
                  color: 'bg-green-500',
                },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div
                    className={`mx-auto mb-2 h-8 w-8 rounded-full ${item.color} flex items-center justify-center text-sm font-bold text-white`}
                  >
                    {item.count}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Words */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>最近添加</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('words')}
            >
              查看全部
            </Button>
          </CardHeader>
          <CardContent>
            {vocabulary.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  生词本是空的，阅读时点击单词添加
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {vocabulary.slice(0, 5).map((word) => (
                  <div
                    key={word.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{word.word}</span>
                      <Badge variant="outline" className="text-xs">
                        {word.partOfSpeech}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {word.translation}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Words Tab */}
      <TabsContent value="words">
        <VocabularyList />
      </TabsContent>

      {/* Review Tab */}
      <TabsContent value="review" className="space-y-6">
        {currentSession ? (
          <div className="space-y-6">
            {/* Session Progress */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    进度: {currentSession.currentIndex + 1} /{' '}
                    {currentSession.cards.length}
                  </span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-green-500">
                      <CheckCircle2 className="h-4 w-4" />
                      {currentSession.correctCount}
                    </span>
                    <span className="flex items-center gap-1 text-red-500">
                      <XCircle className="h-4 w-4" />
                      {currentSession.currentIndex - currentSession.correctCount}
                    </span>
                  </div>
                </div>
                <Progress value={sessionProgress} className="h-2" />
              </CardContent>
            </Card>

            {/* Flashcard */}
            {currentCard ? (
              <FlashCard card={currentCard} onReview={handleReview} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                  <h3 className="mt-4 text-xl font-semibold">复习完成!</h3>
                  <p className="mt-2 text-muted-foreground">
                    你已完成本次复习，正确率:{' '}
                    {currentSession.cards.length > 0
                      ? Math.round(
                          (currentSession.correctCount /
                            currentSession.cards.length) *
                            100
                        )
                      : 0}
                    %
                  </p>
                  <Button
                    className="mt-6"
                    onClick={() => {
                      endSession();
                      setActiveTab('dashboard');
                    }}
                  >
                    返回仪表盘
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* End Session Button */}
            {currentCard && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    endSession();
                    setActiveTab('dashboard');
                  }}
                >
                  结束复习
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              {dueCards.length > 0 ? (
                <>
                  <Target className="h-16 w-16 text-orange-500" />
                  <h3 className="mt-4 text-xl font-semibold">准备复习</h3>
                  <p className="mt-2 text-muted-foreground">
                    你有 {dueCards.length} 个单词需要复习
                  </p>
                  <Button className="mt-6 gap-2" onClick={handleStartReview}>
                    <Play className="h-4 w-4" />
                    开始复习
                  </Button>
                </>
              ) : vocabulary.length > 0 ? (
                <>
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                  <h3 className="mt-4 text-xl font-semibold">太棒了!</h3>
                  <p className="mt-2 text-muted-foreground">
                    今天没有需要复习的单词
                  </p>
                  <Button
                    className="mt-6"
                    variant="outline"
                    onClick={() => setActiveTab('words')}
                  >
                    查看生词本
                  </Button>
                </>
              ) : (
                <>
                  <BookOpen className="h-16 w-16 text-muted-foreground" />
                  <h3 className="mt-4 text-xl font-semibold">生词本是空的</h3>
                  <p className="mt-2 text-muted-foreground">
                    阅读时点击单词添加到生词本
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
