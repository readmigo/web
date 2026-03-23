'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { log } from '@/lib/logger';
import { firebaseAuth } from '@/lib/firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';

interface PhoneLoginFormProps {
  callbackUrl?: string;
}

export function PhoneLoginForm({ callbackUrl = '/' }: PhoneLoginFormProps) {
  const t = useTranslations('auth');
  const router = useRouter();

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [countryCode, setCountryCode] = useState('+86');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const setupRecaptcha = () => {
    if (recaptchaVerifierRef.current) return;
    recaptchaVerifierRef.current = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
      size: 'invisible',
    });
  };

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      setupRecaptcha();
      const fullNumber = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
      log.auth.info('[PhoneAuth] Sending code', { phone: fullNumber.slice(0, -4) + '****' });

      const result = await signInWithPhoneNumber(
        firebaseAuth,
        fullNumber,
        recaptchaVerifierRef.current!
      );
      setConfirmationResult(result);
      setStep('code');
      setCountdown(60);
    } catch (err) {
      log.auth.error('[PhoneAuth] Send code failed', err);
      setError(t('sendCodeFailed'));
      // Reset recaptcha on error
      recaptchaVerifierRef.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim() || !confirmationResult) return;

    setIsLoading(true);
    setError('');

    try {
      const credential = await confirmationResult.confirm(verificationCode);
      const idToken = await credential.user.getIdToken();

      log.auth.info('[PhoneAuth] Code verified, exchanging token');

      const result = await signIn('firebase-phone', {
        idToken,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError(t('phoneAuthFailed'));
      } else if (result?.url) {
        trackEvent('user_logged_in', { method: 'phone', platform: 'web' });
        window.location.href = result.url;
      }
    } catch (err) {
      log.auth.error('[PhoneAuth] Verify failed', err);
      setError(t('invalidCode'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    recaptchaVerifierRef.current = null;
    await handleSendCode();
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Back + Logo */}
      <div className="text-center">
        <button
          onClick={() => step === 'code' ? setStep('phone') : router.push('/login')}
          className="mb-4 text-sm text-white/70 hover:text-white transition-colors"
        >
          {t('back')}
        </button>
        <div className="flex justify-center mb-4">
          <Image
            src="/icons/app-icon.png"
            alt="Readmigo"
            width={80}
            height={80}
            className="rounded-2xl shadow-lg"
          />
        </div>
        <h1 className="text-2xl font-bold text-white">{t('signInPhone')}</h1>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-400/30 p-3 text-sm text-white">
          {error}
        </div>
      )}

      {step === 'phone' ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-white/80">{t('phoneLabel')}</Label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="h-12 w-24 rounded-[10px] bg-white/15 border border-white/20 text-white px-2 text-sm"
              >
                <option value="+86">+86</option>
                <option value="+1">+1</option>
                <option value="+81">+81</option>
                <option value="+82">+82</option>
                <option value="+44">+44</option>
                <option value="+61">+61</option>
                <option value="+65">+65</option>
                <option value="+66">+66</option>
                <option value="+91">+91</option>
              </select>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder={t('phonePlaceholder')}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 bg-white/15 border-white/20 text-white placeholder:text-white/40 h-12 rounded-[10px]"
              />
            </div>
          </div>

          <Button
            className="w-full h-12 rounded-[10px] bg-white text-purple-600 font-semibold hover:bg-white/90"
            onClick={handleSendCode}
            disabled={isLoading || !phoneNumber.trim()}
          >
            {isLoading ? t('sendingCode') : t('sendCode')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-white/80">{t('verificationCode')}</Label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="bg-white/15 border-white/20 text-white placeholder:text-white/40 h-12 rounded-[10px] text-center text-2xl tracking-[0.5em]"
              autoFocus
            />
          </div>

          <Button
            className="w-full h-12 rounded-[10px] bg-white text-purple-600 font-semibold hover:bg-white/90"
            onClick={handleVerifyCode}
            disabled={isLoading || verificationCode.length < 6}
          >
            {isLoading ? t('signingIn') : t('verifyAndSignIn')}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0}
              className="text-sm text-white/60 hover:text-white/80 transition-colors disabled:opacity-40"
            >
              {countdown > 0
                ? t('resendCountdown', { seconds: countdown })
                : t('resendCode')
              }
            </button>
          </div>
        </div>
      )}

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container" ref={recaptchaRef} />

      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-sm">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span className="text-sm font-medium text-white">{t('signingIn')}</span>
        </div>
      )}
    </div>
  );
}
