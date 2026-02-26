import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PapersContent } from './papers-content';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('papersTitle'),
    description: t('papersDescription'),
  };
}

export default async function PapersPage() {
  const t = await getTranslations('metadata');

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('papersTitle')}</h1>
        <p className="text-muted-foreground">{t('papersSubtitle')}</p>
      </div>
      <PapersContent />
    </div>
  );
}
