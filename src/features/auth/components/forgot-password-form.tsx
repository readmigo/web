'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle } from 'lucide-react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Always show success to avoid email enumeration
      setSubmitted(true);
    } catch {
      setError(t('loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-center mb-4">
          <Image
            src="/icons/app-icon.png"
            alt="Readmigo"
            width={80}
            height={80}
            className="rounded-2xl shadow-lg"
          />
        </div>

        <div className="flex flex-col items-center gap-3">
          <CheckCircle className="h-12 w-12 text-white/90" />
          <h1 className="text-2xl font-bold text-white">{t('resetEmailSent')}</h1>
          <p className="text-white/70 text-sm leading-relaxed">{t('resetEmailSentDesc')}</p>
        </div>

        <Link
          href="/login"
          className="block w-full h-12 rounded-[10px] bg-white text-purple-600 font-semibold hover:bg-white/90 transition-colors leading-[3rem] text-center text-sm"
        >
          {t('backToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <Link href="/login" className="inline-block mb-4 text-sm text-white/70 hover:text-white transition-colors">
          {t('back')}
        </Link>
        <div className="flex justify-center mb-4">
          <Image
            src="/icons/app-icon.png"
            alt="Readmigo"
            width={80}
            height={80}
            className="rounded-2xl shadow-lg"
          />
        </div>
        <h1 className="text-2xl font-bold text-white">{t('forgotPasswordTitle')}</h1>
        <p className="mt-2 text-sm text-white/70">{t('forgotPasswordDesc')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/20 border border-red-400/30 p-3 text-sm text-white">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/80">{t('emailLabel')}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/15 border-white/20 text-white placeholder:text-white/40 focus:ring-white/30 h-12 rounded-[10px] pl-9"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-[10px] bg-white text-purple-600 font-semibold hover:bg-white/90"
          disabled={isLoading}
        >
          {isLoading ? t('sendingEmail') : t('sendResetEmail')}
        </Button>
      </form>

      <p className="text-center text-sm text-white/60">
        <Link href="/login" className="text-white hover:underline">
          {t('backToLogin')}
        </Link>
      </p>
    </div>
  );
}
