import { Metadata } from 'next';
import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata: Metadata = {
  title: '注册',
  description: '创建你的 Readmigo 账户',
};

interface RegisterPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { callbackUrl } = await searchParams;

  return <RegisterForm callbackUrl={callbackUrl} />;
}
