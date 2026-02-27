import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { VocabularyContent } from './vocabulary-content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('vocabularyTitle'),
    description: t('vocabularyDescription'),
  };
}

export default async function VocabularyPage() {
  const t = await getTranslations('metadata');

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('vocabularyTitle')}</h1>
        <p className="text-muted-foreground">{t('vocabularySubtitle')}</p>
      </div>
      <VocabularyContent />
    </div>
  );
}
