import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const supportedLocales = ['zh', 'en'] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = 'zh';

function parseAcceptLanguage(header: string): Locale {
  if (header.startsWith('en')) return 'en';
  return 'zh';
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
