import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CommunityContent } from './community-content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('community');
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function CommunityPage() {
  return <CommunityContent />;
}
