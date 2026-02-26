import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AudiobooksContent } from './audiobooks-content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('audiobooksTitle'),
    description: t('audiobooksDescription'),
  };
}

export default function AudiobooksPage() {
  return (
    <div className="container py-6">
      <AudiobooksContent />
    </div>
  );
}
