'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  UserCircle,
  Shield,
  FileText,
  CheckCircle,
  Info,
  LogOut,
  MessageSquare,
  ChevronRight,
  Clock,
  Heart,
  BarChart3,
  Crown,
  Bell,
  Building2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ContinueReadingCard } from '@/features/library/components/continue-reading-card';
import { useBrowsingHistory } from '@/features/library/hooks/use-browsing-history';
import { useFavoriteBookIds } from '@/features/library/hooks/use-favorites';

function MenuRow({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  href,
  onClick,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  destructive?: boolean;
}) {
  const content = (
    <div className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 transition-colors hover:bg-accent">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: iconColor ? `${iconColor}20` : undefined }}
      >
        <div style={{ color: destructive ? 'hsl(var(--destructive))' : iconColor }}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm font-medium ${destructive ? 'text-destructive' : 'text-foreground'}`}
        >
          {title}
        </span>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {!destructive && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return (
    <button className="w-full text-left" onClick={onClick}>
      {content}
    </button>
  );
}

function MenuSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function MeContent() {
  const t = useTranslations('me');
  const tl = useTranslations('library');
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const { history } = useBrowsingHistory();
  const { favoriteIds } = useFavoriteBookIds();

  const hasHistory = history.length > 0;
  const hasFavorites = favoriteIds.size > 0;
  const hasMyContent = isAuthenticated && (hasHistory || hasFavorites);

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Profile Card */}
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        {session?.user ? (
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white"
              style={{ backgroundImage: 'var(--brand-gradient)' }}
            >
              {session.user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold">{session.user.name || t('user')}</h2>
              <p className="text-sm text-muted-foreground">{session.user.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full"
              style={{ backgroundImage: 'var(--brand-gradient)' }}
            >
              <UserCircle className="h-10 w-10 text-white" />
            </div>
            <p className="text-muted-foreground">{t('notLoggedIn')}</p>
            <Button
              asChild
              className="text-white"
              style={{ backgroundImage: 'var(--brand-gradient)' }}
            >
              <Link href="/login">{t('loginRegister')}</Link>
            </Button>
          </div>
        )}
      </div>

      {/* 2. Currently Reading (iOS: ContinueActivitySection) */}
      {isAuthenticated && <ContinueReadingCard />}

      {/* 3. My Content (iOS: section.myContent - Recently Browsed + Favorites) */}
      {hasMyContent && (
        <MenuSection title={t('myContent')}>
          {hasHistory && (
            <MenuRow
              icon={Clock}
              iconColor="#F97316"
              title={tl('recentlyBrowsed')}
              href="/library"
            />
          )}
          {hasFavorites && (
            <MenuRow
              icon={Heart}
              iconColor="#EF4444"
              title={tl('favorites')}
              href="/library"
            />
          )}
        </MenuSection>
      )}

      {/* 4. Reading Data (iOS: section.readingData - Stats + Subscription) */}
      <MenuSection title={t('readingData')}>
        <MenuRow
          icon={BarChart3}
          iconColor="#3B82F6"
          title={t('viewStats')}
          href="/settings"
        />
        <MenuRow
          icon={Crown}
          iconColor="#EAB308"
          title={t('subscription')}
          subtitle={t('subscriptionFree')}
          href="/settings"
        />
      </MenuSection>

      {/* 5. Notifications & Messages (iOS: section.notifications) */}
      <MenuSection title={t('notifications')}>
        <MenuRow
          icon={Bell}
          iconColor="#F97316"
          title={t('notificationCenter')}
          href="/settings"
        />
        <MenuRow
          icon={MessageSquare}
          iconColor="#3B82F6"
          title={t('sendMessage')}
          href="/settings"
        />
      </MenuSection>

      {/* 6. Community (iOS: nav.agora) */}
      <MenuSection title={t('community')}>
        <MenuRow
          icon={Building2}
          iconColor="#A855F7"
          title={t('agora')}
          href="/community"
        />
      </MenuSection>

      {/* 7. Other (iOS: section.other - About + Legal) */}
      <MenuSection title={t('other')}>
        <MenuRow
          icon={Info}
          iconColor="#6B7280"
          title={t('aboutReadmigo')}
          href="/settings"
        />
        <MenuRow
          icon={Shield}
          iconColor="#22C55E"
          title={t('privacyPolicy')}
          onClick={() => window.open('https://readmigo.app/privacy', '_blank')}
        />
        <MenuRow
          icon={FileText}
          iconColor="#A855F7"
          title={t('termsOfService')}
          onClick={() => window.open('https://readmigo.app/terms', '_blank')}
        />
        <MenuRow
          icon={CheckCircle}
          iconColor="#3B82F6"
          title={t('userAgreement')}
          onClick={() => window.open('https://readmigo.app/terms', '_blank')}
        />
      </MenuSection>

      {/* 8. Account - Sign Out (iOS: section.account) */}
      {isAuthenticated && (
        <MenuSection title={t('account')}>
          <MenuRow
            icon={LogOut}
            title={t('signOut')}
            destructive
            onClick={() => {
              window.location.href = '/api/auth/signout';
            }}
          />
        </MenuSection>
      )}
    </div>
  );
}
