'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/shared/global-search';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Store,
  Headphones,
  UserCircle,
  Search,
  Settings,
} from 'lucide-react';

// iOS tab structure: 书架, 书城, 有声书, 我的
const navigation = [
  { name: '书城', href: '/explore', icon: Store },
  { name: '书架', href: '/library', icon: BookOpen },
  { name: '有声书', href: '/audiobooks', icon: Headphones },
  { name: '我的', href: '/me', icon: UserCircle },
];

export function Header() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href === '/explore' && pathname === '/');

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-14 items-center">
          {/* Brand Logo */}
          <Link href="/" className="mr-6 flex items-center gap-2.5">
            <Image
              src="/icons/icon.svg"
              alt="ReadMigo"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span
              className="text-lg font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: 'var(--brand-gradient)' }}
            >
              ReadMigo
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

          {/* Right side */}
          <div className="ml-auto flex items-center gap-1.5">
            {/* Search Button (Desktop) */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline text-sm">搜索...</span>
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            {/* Search Button (Mobile) */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
