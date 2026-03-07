'use client';

import { useRef, useEffect } from 'react';
import {
  BookOpen, Clock, Lightbulb, FlaskConical, TrendingUp,
  Sparkles, BookMarked, Smile, Globe, Heart, Users, Star,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookstoreTab } from '../types';

const ICON_MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  'book-open': BookOpen,
  clock: Clock,
  lightbulb: Lightbulb,
  beaker: FlaskConical,
  'face-smile': Smile,
  'chart-line': TrendingUp,
  book: BookMarked,
  globe: Globe,
  heart: Heart,
  users: Users,
  star: Star,
};

function getTabIcon(icon?: string): LucideIcon {
  if (!icon) return BookOpen;
  return ICON_MAP[icon] ?? BookOpen;
}

interface BookstoreTabBarProps {
  tabs: BookstoreTab[];
  selectedTabId: string;
  onTabSelect: (tabId: string) => void;
}

export function BookstoreTabBar({ tabs, selectedTabId, onTabSelect }: BookstoreTabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view when selectedTabId changes
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const scrollLeft =
        container.scrollLeft +
        elRect.left -
        containerRect.left -
        containerRect.width / 2 +
        elRect.width / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [selectedTabId]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
    >
      {tabs.map((tab) => {
        const isSelected = tab.id === selectedTabId;
        const Icon = getTabIcon(tab.icon);
        return (
          <button
            key={tab.id}
            ref={isSelected ? activeRef : undefined}
            type="button"
            onClick={() => onTabSelect(tab.id)}
            className={cn(
              'flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground hover:bg-secondary/80'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.name}</span>
          </button>
        );
      })}
    </div>
  );
}
