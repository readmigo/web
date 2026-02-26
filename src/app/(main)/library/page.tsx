import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LibraryContent } from './library-content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('libraryTitle'),
    description: t('libraryDescription'),
  };
}

export default async function LibraryPage() {
  const t = await getTranslations('metadata');

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('libraryTitle')}</h1>
        <p className="text-muted-foreground">{t('librarySubtitle')}</p>
      </div>
      <LibraryContent />
    </div>
  );
}
