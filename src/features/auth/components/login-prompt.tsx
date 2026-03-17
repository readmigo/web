'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  LogIn,
  X,
  BookOpen,
  Bookmark,
  Highlighter,
  BookMarked,
  BarChart3,
  Trophy,
  FileText,
  Headphones,
  Languages,
  RefreshCw,
  Users,
  ScrollText,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Feature identifiers aligned with iOS LoginFeature enum.
 */
export type LoginFeature =
  | 'library'
  | 'bookmark'
  | 'highlight'
  | 'vocabulary'
  | 'stats'
  | 'achievements'
  | 'notes'
  | 'audiobook'
  | 'translation'
  | 'sync'
  | 'community'
  | 'paper';

const FEATURE_ICONS: Record<LoginFeature, React.ElementType> = {
  library: BookOpen,
  bookmark: Bookmark,
  highlight: Highlighter,
  vocabulary: BookMarked,
  stats: BarChart3,
  achievements: Trophy,
  notes: FileText,
  audiobook: Headphones,
  translation: Languages,
  sync: RefreshCw,
  community: Users,
  paper: ScrollText,
};

const KNOWN_FEATURES = new Set<string>(Object.keys(FEATURE_ICONS));

function isKnownFeature(f: string | undefined): f is LoginFeature {
  return !!f && KNOWN_FEATURES.has(f);
}

interface LoginPromptProps {
  feature?: LoginFeature | string;
  onDismiss: () => void;
}

/**
 * Modal prompt shown when a guest user tries to access a feature that requires login.
 * Aligned with iOS LoginPromptView.
 *
 * Accepts an optional `feature` prop to display contextual title and description.
 * Falls back to generic copy when the feature is unknown.
 */
export function LoginPrompt({ feature, onDismiss }: LoginPromptProps) {
  const router = useRouter();
  const t = useTranslations('auth');

  const Icon = isKnownFeature(feature) ? FEATURE_ICONS[feature] : LogIn;

  const title = isKnownFeature(feature)
    ? t(`loginFeatures.${feature}.title` as Parameters<typeof t>[0])
    : t('loginRequired');

  const description = isKnownFeature(feature)
    ? t(`loginFeatures.${feature}.desc` as Parameters<typeof t>[0])
    : t('loginPromptDesc');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-background p-6 animate-in zoom-in-95 duration-200">
        <button
          className="absolute right-3 top-3 rounded-full p-1 hover:bg-muted"
          onClick={onDismiss}
          aria-label={t('continueBrowsing')}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="mt-6 space-y-2">
          <Button
            className="w-full"
            onClick={() => {
              onDismiss();
              router.push('/login');
            }}
          >
            {t('loginNow')}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onDismiss}>
            {t('continueBrowsing')}
          </Button>
        </div>
      </div>
    </div>
  );
}
