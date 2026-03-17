'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { clearUserData } from '@/lib/auth/clear-user-data';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
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
  Camera,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ContinueReadingCard } from '@/features/library/components/continue-reading-card';
import { useBrowsingHistory } from '@/features/library/hooks/use-browsing-history';
import { useFavoriteBookIds } from '@/features/library/hooks/use-favorites';
import { useSubscription } from '@/features/subscription/hooks/use-subscription';
import { useUnreadCount } from '@/features/notifications/hooks/use-notifications';

// ─── helpers ────────────────────────────────────────────────────────────────

function sizedAvatarUrl(url: string): string {
  const lastPart = url.split('/').pop() ?? '';
  if (lastPart.includes('.')) return url; // legacy URL already has extension
  return url + '_medium.webp';
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, 512, 512);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas empty'))),
      'image/jpeg',
      0.8
    );
  });
}

// ─── sub-components ──────────────────────────────────────────────────────────

function MenuRow({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  href,
  onClick,
  destructive,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  destructive?: boolean;
  badge?: number;
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
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {!destructive && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;

  return (
    <button className="w-full text-left" onClick={onClick}>
      {content}
    </button>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

// ─── crop modal ──────────────────────────────────────────────────────────────

function CropModal({
  open,
  imageSrc,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const tAvatar = useTranslations('me.avatar');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedArea(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedArea) return;
    const blob = await getCroppedBlob(imageSrc, croppedArea);
    onConfirm(blob);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{tAvatar('title')}</DialogTitle>
        </DialogHeader>

        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="space-y-1 px-1">
          <p className="text-xs text-muted-foreground">{tAvatar('zoom')}</p>
          <Slider
            min={1}
            max={3}
            step={0.05}
            value={[zoom]}
            onValueChange={([v]) => setZoom(v)}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            {tAvatar('cancel')}
          </Button>
          <Button onClick={handleConfirm}>{tAvatar('confirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── avatar button ───────────────────────────────────────────────────────────

function AvatarButton({
  avatarUrl,
  displayName,
  optimisticSrc,
  isUploading,
  hasAvatar,
  onChoosePhoto,
  onRemoveAvatar,
}: {
  avatarUrl?: string | null;
  displayName?: string | null;
  optimisticSrc?: string | null;
  isUploading: boolean;
  hasAvatar: boolean;
  onChoosePhoto: () => void;
  onRemoveAvatar: () => void;
}) {
  const tAvatar = useTranslations('me.avatar');
  const [menuOpen, setMenuOpen] = useState(false);

  const resolvedUrl = optimisticSrc ?? (avatarUrl ? sizedAvatarUrl(avatarUrl) : null);
  const initial = displayName?.[0]?.toUpperCase() ?? 'U';

  return (
    <div className="relative">
      <button
        className="relative h-16 w-16 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setMenuOpen((v) => !v)}
        disabled={isUploading}
        aria-label={tAvatar('title')}
      >
        {resolvedUrl ? (
          <Image
            src={resolvedUrl}
            alt={displayName ?? 'avatar'}
            fill
            className="rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center rounded-full text-xl font-bold text-white"
            style={{ backgroundImage: 'var(--brand-gradient)' }}
          >
            {initial}
          </div>
        )}

        {/* camera badge */}
        <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-primary">
          {isUploading ? (
            <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <Camera className="h-2.5 w-2.5 text-primary-foreground" />
          )}
        </span>
      </button>

      {/* dropdown menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 min-w-[160px] rounded-xl border bg-popover p-1 shadow-md">
            <button
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
              onClick={() => {
                setMenuOpen(false);
                onChoosePhoto();
              }}
            >
              <Camera className="h-4 w-4" />
              {tAvatar('choosePhoto')}
            </button>
            {hasAvatar && (
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-accent"
                onClick={() => {
                  setMenuOpen(false);
                  onRemoveAvatar();
                }}
              >
                <Trash2 className="h-4 w-4" />
                {tAvatar('removeAvatar')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function MeContent() {
  const t = useTranslations('me');
  const tAvatar = useTranslations('me.avatar');
  const tl = useTranslations('library');
  const { data: session, update } = useSession();
  const isAuthenticated = !!session?.user;
  const { history } = useBrowsingHistory();
  const { favoriteIds } = useFavoriteBookIds();
  const { isPro } = useSubscription();
  const { data: unreadCount } = useUnreadCount();

  const hasHistory = history.length > 0;
  const hasFavorites = favoriteIds.size > 0;
  const hasMyContent = isAuthenticated && (hasHistory || hasFavorites);

  // avatar state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [optimisticSrc, setOptimisticSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawImageSrc(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleCropConfirm = async (blob: Blob) => {
    const previewUrl = URL.createObjectURL(blob);
    setRawImageSrc(null);
    setOptimisticSrc(previewUrl);
    setIsUploading(true);
    setUploadError(null);

    try {
      const form = new FormData();
      form.append('file', blob, 'avatar.jpg');
      const res = await fetch('/api/avatar', { method: 'POST', body: form });
      if (!res.ok) throw new Error('upload failed');
      const data = await res.json();
      await update({ image: data?.avatarUrl ?? null });
      setOptimisticSrc(null);
    } catch {
      setOptimisticSrc(null);
      setUploadError(tAvatar('uploadError'));
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await fetch('/api/avatar', { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      await update({ image: null });
    } catch {
      setUploadError(tAvatar('uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* crop modal */}
      {rawImageSrc && (
        <CropModal
          open
          imageSrc={rawImageSrc}
          onCancel={() => {
            URL.revokeObjectURL(rawImageSrc);
            setRawImageSrc(null);
          }}
          onConfirm={handleCropConfirm}
        />
      )}

      {/* 1. Profile Card */}
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        {session?.user ? (
          <div className="flex items-center gap-4">
            <AvatarButton
              avatarUrl={session.user.image}
              displayName={session.user.name}
              optimisticSrc={optimisticSrc}
              isUploading={isUploading}
              hasAvatar={!!session.user.image}
              onChoosePhoto={() => fileInputRef.current?.click()}
              onRemoveAvatar={handleRemoveAvatar}
            />
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

        {uploadError && <p className="mt-3 text-xs text-destructive">{uploadError}</p>}
      </div>

      {/* 2. Currently Reading */}
      {isAuthenticated && <ContinueReadingCard />}

      {/* 3. My Content */}
      {hasMyContent && (
        <MenuSection title={t('myContent')}>
          {hasHistory && (
            <MenuRow icon={Clock} iconColor="#F97316" title={tl('recentlyBrowsed')} href="/library" />
          )}
          {hasFavorites && (
            <MenuRow icon={Heart} iconColor="#EF4444" title={tl('favorites')} href="/library" />
          )}
        </MenuSection>
      )}

      {/* 4. Reading Data */}
      <MenuSection title={t('readingData')}>
        <MenuRow icon={BarChart3} iconColor="#3B82F6" title={t('viewStats')} href="/settings" />
        <MenuRow
          icon={Crown}
          iconColor="#EAB308"
          title={
            isPro
              ? `${t('subscription')} — Pro`
              : t('subscription')
          }
          subtitle={
            isPro
              ? t('subscriptionPro')
              : t('subscriptionFree')
          }
          href="/settings"
        />
      </MenuSection>

      {/* 5. Notifications & Messages */}
      <MenuSection title={t('notifications')}>
        <MenuRow
          icon={Bell}
          iconColor="#F97316"
          title={t('notificationCenter')}
          href="/settings"
          badge={unreadCount ?? 0}
        />
        <MenuRow icon={MessageSquare} iconColor="#3B82F6" title={t('sendMessage')} href="/settings" />
      </MenuSection>

      {/* 6. Community */}
      <MenuSection title={t('community')}>
        <MenuRow icon={Building2} iconColor="#A855F7" title={t('agora')} href="/community" />
      </MenuSection>

      {/* 7. Other */}
      <MenuSection title={t('other')}>
        <MenuRow icon={Info} iconColor="#6B7280" title={t('aboutReadmigo')} href="/settings" />
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

      {/* 8. Account - Sign Out */}
      {isAuthenticated && (
        <MenuSection title={t('account')}>
          <MenuRow
            icon={LogOut}
            title={t('signOut')}
            destructive
            onClick={() => {
              clearUserData();
              window.location.href = '/api/auth/signout';
            }}
          />
        </MenuSection>
      )}
    </div>
  );
}
