import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AudiobookDetailContent } from './audiobook-detail-content';

interface AudiobookPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AudiobookPageProps): Promise<Metadata> {
  await params;
  const t = await getTranslations('metadata');
  return {
    title: t('audiobooksTitle'),
    description: t('audiobooksDescription'),
  };
}

export default async function AudiobookPage({ params }: AudiobookPageProps) {
  const { id } = await params;

  return <AudiobookDetailContent audiobookId={id} />;
}
