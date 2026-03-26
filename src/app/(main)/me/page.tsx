import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { MeContent, MeErrorBoundary } from './me-content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('meTitle'),
    description: t('meDescription'),
  };
}

export default function MePage() {
  return (
    <div className="container py-6">
      <MeErrorBoundary>
        <MeContent />
      </MeErrorBoundary>
    </div>
  );
}
