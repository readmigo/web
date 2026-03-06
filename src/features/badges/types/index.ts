export type BadgeCategory = 'reading' | 'vocabulary' | 'streak' | 'milestone' | 'social';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface BadgeRequirement {
  type: string;
  targetValue: number;
  description: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  category: BadgeCategory;
  tier: BadgeTier;
  requirement: BadgeRequirement;
  sortOrder?: number;
}

export interface UserBadge {
  id: string;
  badge: Badge;
  earnedAt: string;
}

export interface BadgeProgress {
  badge: Badge;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
  isComplete: boolean;
}
