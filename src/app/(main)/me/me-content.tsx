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
} from 'lucide-react';
import { useTranslations } from 'next-intl';

function MenuRow({
  icon: Icon,
  iconColor,
  title,
  href,
  onClick,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  title: string;
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
      <span
        className={`flex-1 text-sm font-medium ${destructive ? 'text-destructive' : 'text-foreground'}`}
      >
        {title}
      </span>
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
  const { data: session } = useSession();

  return (
    <div className="space-y-6 pb-8">
      {/* Profile Card */}
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

      {/* Contact Section */}
      <MenuSection title={t('contactUs')}>
        <MenuRow
          icon={MessageSquare}
          iconColor="#3B82F6"
          title={t('contactUs')}
          href="/settings"
        />
      </MenuSection>

      {/* Legal Section */}
      <MenuSection title={t('legal')}>
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

      {/* About Section */}
      <MenuSection title={t('about')}>
        <MenuRow
          icon={Info}
          iconColor="#6B7280"
          title={t('aboutReadmigo')}
          href="/settings"
        />
      </MenuSection>

      {/* Sign Out */}
      {session?.user && (
        <MenuSection title={t('account')}>
          <MenuRow
            icon={LogOut}
            title={t('signOut')}
            destructive
            onClick={() => {
              // signOut handled by next-auth
              window.location.href = '/api/auth/signout';
            }}
          />
        </MenuSection>
      )}
    </div>
  );
}
