import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ReaderContent } from './reader-content';

interface ReaderPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ReaderPageProps): Promise<Metadata> {
  await params;
  const t = await getTranslations('metadata');
  return {
    title: t('bookDetailTitle'),
    description: t('bookDetailDescription'),
  };
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { id } = await params;

  return <ReaderContent bookId={id} />;
}
