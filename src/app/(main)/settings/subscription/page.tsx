import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SubscriptionPageContent } from './subscription-page-content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('subscription.page');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function SubscriptionPage() {
  const t = await getTranslations('subscription.page');

  return (
    <div className="container max-w-4xl py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('heading')}</h1>
        <p className="text-muted-foreground">{t('subheading')}</p>
      </div>
      <SubscriptionPageContent />
    </div>
  );
}
