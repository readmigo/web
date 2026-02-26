import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('auth');

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
      <main className="flex flex-1 items-center justify-center p-4">
        {children}
      </main>
      <footer className="flex items-center justify-center gap-4 py-4 text-sm text-white/60">
        <Link
          href="https://readmigo.app/terms"
          target="_blank"
          className="hover:text-white/80 transition-colors"
        >
          {t('termsOfService')}
        </Link>
        <span>·</span>
        <Link
          href="https://readmigo.app/privacy"
          target="_blank"
          className="hover:text-white/80 transition-colors"
        >
          {t('privacyPolicy')}
        </Link>
      </footer>
    </div>
  );
}
