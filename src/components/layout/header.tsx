'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/shared/global-search';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  GraduationCap,
  Headphones,
  Search,
  User,
  Settings,
  Compass,
} from 'lucide-react';

const navigation = [
  { name: '探索', href: '/explore', icon: Compass },
  { name: '书架', href: '/library', icon: BookOpen },
  { name: '词汇', href: '/vocabulary', icon: GraduationCap },
  { name: '有声书', href: '/audiobooks', icon: Headphones },
];

export function Header() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          {/* Logo */}
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-bold">Readmigo</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 transition-colors hover:text-foreground/80',
                  pathname === item.href
                    ? 'text-foreground'
                    : 'text-foreground/60'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center space-x-2">
            {/* Search Button */}
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2 text-muted-foreground"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline">搜索...</span>
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            {/* Mobile Search Button */}
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

            {/* User */}
            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Global Search */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
