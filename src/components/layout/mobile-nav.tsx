'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Store,
  Headphones,
  UserCircle,
} from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  // iOS tab structure: 书城, 书架, 有声书, 我的
  const navigation = [
    { name: t('bookstore'), href: '/explore', icon: Store },
    { name: t('library'), href: '/library', icon: BookOpen },
    { name: t('audiobooks'), href: '/audiobooks', icon: Headphones },
    { name: t('me'), href: '/me', icon: UserCircle },
  ];

  const isActive = (href: string) =>
    pathname === href || (href === '/explore' && pathname === '/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navigation.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', active && 'text-primary')} />
              <span className={cn(active && 'font-medium')}>{item.name}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS devices */}
      <div className="h-safe-area-inset-bottom bg-card" />
    </nav>
  );
}
