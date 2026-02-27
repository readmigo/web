import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LearnContent } from './learn-content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('learnTitle'),
    description: t('learnDescription'),
  };
}

export default async function LearnPage() {
  const t = await getTranslations('metadata');

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('learnHeading')}</h1>
        <p className="text-muted-foreground">{t('learnSubtitle')}</p>
      </div>
      <LearnContent />
    </div>
  );
}
