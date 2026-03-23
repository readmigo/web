import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PhoneLoginForm } from '@/features/auth/components/phone-login-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('loginTitle'),
  };
}

interface PhoneLoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function PhoneLoginPage({ searchParams }: PhoneLoginPageProps) {
  const { callbackUrl } = await searchParams;
  return <PhoneLoginForm callbackUrl={callbackUrl} />;
}
