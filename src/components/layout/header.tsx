'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Store,
  Headphones,
  UserCircle,
} from 'lucide-react';

// iOS tab structure: 书城, 书城, 有声书, 我的
const navigation = [
  { name: '书城', href: '/explore', icon: Store },
  { name: '书架', href: '/library', icon: BookOpen },
  { name: '有声书', href: '/audiobooks', icon: Headphones },
  { name: '我的', href: '/me', icon: UserCircle },
];

export function Header() {
  const pathname = usePathname();

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
      </div>
    </header>
  );
}
