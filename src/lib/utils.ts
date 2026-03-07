import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export interface ReadTimeTranslations {
  minutes: (count: number) => string;
  hours: (count: number) => string;
  hoursAndMinutes: (hours: number, minutes: number) => string;
}

export function formatReadTime(mins: number, t: ReadTimeTranslations): string {
  if (mins < 60) {
    return t.minutes(mins);
  }
  const hours = Math.floor(mins / 60);
  const remainingMinutes = mins % 60;
  if (remainingMinutes === 0) {
    return t.hours(hours);
  }
  return t.hoursAndMinutes(hours, remainingMinutes);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export interface RelativeTimeTranslations {
  justNow: string;
  minutesAgo: (count: number) => string;
  hoursAgo: (count: number) => string;
  daysAgo: (count: number) => string;
  weeksAgo: (count: number) => string;
  monthsAgo: (count: number) => string;
  yearsAgo: (count: number) => string;
}

export function formatRelativeTime(date: Date | string, t: RelativeTimeTranslations): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t.justNow;
  if (diffMins < 60) return t.minutesAgo(diffMins);
  if (diffHours < 24) return t.hoursAgo(diffHours);
  if (diffDays < 7) return t.daysAgo(diffDays);
  if (diffDays < 30) return t.weeksAgo(Math.floor(diffDays / 7));
  if (diffDays < 365) return t.monthsAgo(Math.floor(diffDays / 30));
  return t.yearsAgo(Math.floor(diffDays / 365));
}
