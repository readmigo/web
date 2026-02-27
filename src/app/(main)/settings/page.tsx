import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SettingsContent } from './settings-content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('settingsTitle'),
    description: t('settingsDescription'),
  };
}

export default async function SettingsPage() {
  const t = await getTranslations('metadata');

  return (
    <div className="container max-w-4xl py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('settingsTitle')}</h1>
        <p className="text-muted-foreground">{t('settingsSubtitle')}</p>
      </div>
      <SettingsContent />
    </div>
  );
}
