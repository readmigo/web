'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Store,
  Headphones,
  UserCircle,
  Download,
} from 'lucide-react';

export function Header() {
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
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-14 items-center">
        {/* Brand Logo — same as iOS app icon */}
        <Link href="/" className="mr-6 flex items-center gap-2.5">
          <Image
            src="/icons/app-icon.png"
            alt="Readmigo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span
            className="text-lg font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: 'var(--brand-gradient)' }}
          >
            Readmigo
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Download App Button */}
        <div className="ml-auto">
          <a
            href="https://readmigo.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t('downloadApp')}</span>
          </a>
        </div>
      </div>
    </header>
  );
}
