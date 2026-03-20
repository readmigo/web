import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const supportedLocales = [
  'zh', 'zh-Hant', 'en', 'es', 'fr', 'pt', 'ja', 'ko', 'ar', 'id', 'ru', 'tr'
] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = 'zh';

function parseAcceptLanguage(header: string): Locale {
  const parts = header.split(',').map(s => {
    const [lang, q] = s.trim().split(';q=');
    return { lang: lang.trim().toLowerCase(), q: q ? parseFloat(q) : 1 };
  }).sort((a, b) => b.q - a.q);

  for (const { lang } of parts) {
    if (lang === 'zh-hant' || lang === 'zh-tw' || lang === 'zh-hk') return 'zh-Hant';
    if (lang.startsWith('zh')) return 'zh';
    if (lang.startsWith('en')) return 'en';
    if (lang.startsWith('es')) return 'es';
    if (lang.startsWith('fr')) return 'fr';
    if (lang.startsWith('pt')) return 'pt';
    if (lang.startsWith('ja')) return 'ja';
    if (lang.startsWith('ko')) return 'ko';
    if (lang.startsWith('ar')) return 'ar';
    if (lang.startsWith('id')) return 'id';
    if (lang.startsWith('ru')) return 'ru';
    if (lang.startsWith('tr')) return 'tr';
  }
  return defaultLocale;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  // Priority: cookie > Accept-Language header > default
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const acceptLanguage = headerStore.get('accept-language') || '';

  let locale: Locale = defaultLocale;

  if (cookieLocale && supportedLocales.includes(cookieLocale as Locale)) {
    locale = cookieLocale as Locale;
  } else if (acceptLanguage) {
    locale = parseAcceptLanguage(acceptLanguage);
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
