'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  GraduationCap,
  Headphones,
  Compass,
} from 'lucide-react';

const navigation = [
  { name: '探索', href: '/explore', icon: Compass },
  { name: '书架', href: '/library', icon: BookOpen },
  { name: '词汇', href: '/vocabulary', icon: GraduationCap },
  { name: '有声书', href: '/audiobooks', icon: Headphones },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className={cn(isActive && 'font-medium')}>{item.name}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS devices */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </nav>
  );
}
