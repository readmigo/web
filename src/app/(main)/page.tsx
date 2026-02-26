import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ExploreContent } from './explore/explore-content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('exploreTitle'),
    description: t('exploreDescription'),
  };
}

export default function HomePage() {
  return <ExploreContent />;
}
