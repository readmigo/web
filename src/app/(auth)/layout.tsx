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
      <footer className="flex flex-col items-center gap-1 px-6 py-4 text-center text-xs text-white/50">
        <p>
          {t('byUsing')}{' '}
          <Link
            href="https://readmigo.app/terms?utm_source=web_app&utm_medium=referral&utm_campaign=auth_footer"
            target="_blank"
            className="text-white/70 underline underline-offset-2 hover:text-white/90 transition-colors"
          >
            {t('termsOfService')}
          </Link>
          {' '}{t('andThe')}{' '}
          <Link
            href="https://readmigo.app/privacy?utm_source=web_app&utm_medium=referral&utm_campaign=auth_footer"
            target="_blank"
            className="text-white/70 underline underline-offset-2 hover:text-white/90 transition-colors"
          >
            {t('privacyPolicy')}
          </Link>
        </p>
      </footer>
    </div>
  );
}
