export interface TodayStats {
  readingSeconds: number;
  ttsSeconds: number;
  audiobookSeconds: number;
  totalSeconds: number;
  pagesRead: number;
  sessionCount: number;
}

export interface DailyBreakdown {
  date: string;
  readingSeconds: number;
  ttsSeconds: number;
  audiobookSeconds: number;
  totalSeconds: number;
}

export interface WeeklyStats {
  days: DailyBreakdown[];
  totalSeconds: number;
  readingSeconds: number;
  ttsSeconds: number;
  audiobookSeconds: number;
  activeDays: number;
  averagePerDay: number;
  sessionCount: number;
}

export interface MonthlyStats {
  totalSeconds: number;
  readingSeconds: number;
  ttsSeconds: number;
  audiobookSeconds: number;
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
}

export interface ReadingStatsResponse {
  today: TodayStats;
  weekly: WeeklyStats;
  monthly: MonthlyStats;
}
