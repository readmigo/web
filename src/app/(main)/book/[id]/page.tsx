import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { BookDetailContent } from './book-detail-content';

interface BookPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  const [t] = await Promise.all([getTranslations('metadata'), params]);
  // TODO: Fetch book data for metadata
  return {
    title: t('bookDetailTitle'),
    description: t('bookDetailDescription'),
  };
}

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params;

  return <BookDetailContent bookId={id} />;
}
