'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  Brain,
  Target,
  Flame,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { useLearningStore } from '../stores/learning-store';

export function LearningStats() {
  const { getStats } = useLearningStore();
  const stats = getStats();

  const masteryPercentage =
    stats.totalWords > 0
      ? Math.round((stats.masteredWords / stats.totalWords) * 100)
      : 0;

  const statCards = [
    {
      title: '总词汇量',
      value: stats.totalWords,
      icon: BookOpen,
      color: 'text-blue-500',
    },
    {
      title: '已掌握',
      value: stats.masteredWords,
      icon: Brain,
      color: 'text-green-500',
    },
    {
      title: '学习中',
      value: stats.learningWords,
      icon: Target,
      color: 'text-yellow-500',
    },
    {
      title: '今日待复习',
      value: stats.reviewsDueToday,
      icon: Calendar,
      color: 'text-orange-500',
    },
    {
      title: '连续学习',
      value: `${stats.streakDays} 天`,
      icon: Flame,
      color: 'text-red-500',
    },
    {
      title: '总复习次数',
      value: stats.totalReviews,
      icon: TrendingUp,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">学习进度</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">掌握进度</span>
            <span className="text-sm font-medium">{masteryPercentage}%</span>
          </div>
          <Progress value={masteryPercentage} className="h-2" />
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {stats.masteredWords}
              </div>
              <div className="text-xs text-muted-foreground">已掌握</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {stats.learningWords}
              </div>
              <div className="text-xs text-muted-foreground">学习中</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">
                {stats.newWords}
              </div>
              <div className="text-xs text-muted-foreground">新词</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-lg bg-muted p-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.title}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
