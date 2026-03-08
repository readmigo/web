import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { BookstoreContent } from './bookstore/bookstore-content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('bookstoreTitle'),
    description: t('bookstoreDescription'),
  };
}

export default function HomePage() {
  return (
    <div className="container py-6">
      <BookstoreContent />
    </div>
  );
}
