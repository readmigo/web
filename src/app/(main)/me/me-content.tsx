'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  HardDrive,
  Trash2,
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
  showChevron = true,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}) {
  const content = (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent">
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
      {showChevron && !destructive && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
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

function MenuDivider() {
  return <hr className="ml-[52px] border-border" />;
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
      <h3 className="px-1 text-sm font-semibold text-muted-foreground">
        {title}
      </h3>
      <div className="overflow-hidden rounded-xl bg-card">{children}</div>
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
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  const [cacheSize, setCacheSize] = useState<string | null>(null);

  const hasHistory = history.length > 0;
  const hasFavorites = favoriteIds.size > 0;
  const hasMyContent = isAuthenticated && (hasHistory || hasFavorites);

  useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(({ usage }) => {
        if (usage != null) {
          const mb = usage / (1024 * 1024);
          setCacheSize(mb < 1 ? `${Math.round(usage / 1024)} KB` : `${mb.toFixed(1)} MB`);
        }
      });
    }
  }, []);

  const handleClearCache = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      setCacheSize('0 KB');
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4 pb-8">
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

      {/* 2. Currently Reading */}
      {isAuthenticated && <ContinueReadingCard />}

      {/* 3. My Content */}
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
          {hasHistory && hasFavorites && <MenuDivider />}
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

      {/* 4. Reading Data */}
      <MenuSection title={t('readingData')}>
        <MenuRow
          icon={BarChart3}
          iconColor="#3B82F6"
          title={t('viewStats')}
          href="/stats"
        />
        <MenuDivider />
        <MenuRow
          icon={Crown}
          iconColor="#EAB308"
          title={t('subscription')}
          subtitle={t('subscriptionFree')}
          href="/settings"
        />
      </MenuSection>

      {/* 5. Notifications & Messages */}
      <MenuSection title={t('notifications')}>
        <MenuRow
          icon={Bell}
          iconColor="#F97316"
          title={t('notificationCenter')}
          href="/notifications"
        />
        <MenuDivider />
        <MenuRow
          icon={MessageSquare}
          iconColor="#3B82F6"
          title={t('sendMessage')}
          href="/messaging"
        />
      </MenuSection>

      {/* 6. Community */}
      <MenuSection title={t('community')}>
        <MenuRow
          icon={Building2}
          iconColor="#A855F7"
          title={t('agora')}
          href="/community"
        />
      </MenuSection>

      {/* 7. Storage */}
      <MenuSection title="Storage">
        <MenuRow
          icon={HardDrive}
          iconColor="#6B7280"
          title="Cache Size"
          subtitle={cacheSize ?? '—'}
          showChevron={false}
        />
        <MenuDivider />
        <MenuRow
          icon={Trash2}
          title="Clear Cache"
          destructive
          showChevron={false}
          onClick={() => setShowClearCacheDialog(true)}
        />
      </MenuSection>

      {/* 8. Other */}
      <MenuSection title={t('other')}>
        <MenuRow
          icon={Info}
          iconColor="#6B7280"
          title={t('aboutReadmigo')}
          href="/about"
        />
        <MenuDivider />
        <MenuRow
          icon={Shield}
          iconColor="#22C55E"
          title={t('privacyPolicy')}
          onClick={() => window.open('https://readmigo.app/privacy', '_blank')}
        />
        <MenuDivider />
        <MenuRow
          icon={FileText}
          iconColor="#A855F7"
          title={t('termsOfService')}
          onClick={() => window.open('https://readmigo.app/terms', '_blank')}
        />
        <MenuDivider />
        <MenuRow
          icon={CheckCircle}
          iconColor="#3B82F6"
          title={t('userAgreement')}
          onClick={() => window.open('https://readmigo.app/terms', '_blank')}
        />
      </MenuSection>

      {/* 9. Account - Sign Out */}
      {isAuthenticated && (
        <MenuSection title={t('account')}>
          <MenuRow
            icon={LogOut}
            title={t('signOut')}
            destructive
            showChevron={false}
            onClick={() => setShowSignOutDialog(true)}
          />
        </MenuSection>
      )}

      {/* Sign Out Confirmation */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('signOut')}</AlertDialogTitle>
            <AlertDialogDescription>
              确定要退出登录吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { window.location.href = '/api/auth/signout'; }}
            >
              {t('signOut')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Cache Confirmation */}
      <AlertDialog open={showClearCacheDialog} onOpenChange={setShowClearCacheDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Cache</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all cached data ({cacheSize ?? '—'}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleClearCache}
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
