'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileNav } from '@/components/layout/mobile-nav';
import { useActivityTracker } from '@/lib/hooks/useActivityTracker';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Track user activity for DAU/MAU statistics
  useActivityTracker();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <MobileNav />
    </div>
  );
}
