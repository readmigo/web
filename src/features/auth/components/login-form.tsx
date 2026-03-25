'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { trackEvent } from '@/lib/analytics';
import { log } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Eye, EyeOff, Phone, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useGuestMode } from '@/features/auth/hooks/use-guest-mode';
function LineLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

function KakaoLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.664 6.201 3 12 3z" />
    </svg>
  );
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl = '/' }: LoginFormProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const { enterGuestMode } = useGuestMode();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userRegion, setUserRegion] = useState<string>('other');
  // D8: inline validation state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState('');

  useEffect(() => {
    const lang = navigator.language || '';
    if (lang.startsWith('ja')) setUserRegion('jp');
    else if (lang.startsWith('ko')) setUserRegion('kr');
  }, []);

  // D8: validate email on blur
  const handleEmailBlur = () => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t('emailInvalid'));
    } else {
      setEmailError('');
    }
  };

  // D8: validate password on blur
  const handlePasswordBlur = () => {
    if (password && password.length < 8) {
      setPasswordError(t('passwordTooShort'));
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // D8: run validation before submit
    let hasError = false;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t('emailInvalid'));
      hasError = true;
    }
    if (!password || password.length < 8) {
      setPasswordError(t('passwordTooShort'));
      hasError = true;
    }
    if (hasError) return;

    setIsLoading(true);
    setError('');
    log.auth.warn('[Email] sign-in initiated');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      log.auth.warn('[Email] sign-in result', { error: result?.error, hasUrl: !!result?.url });

      if (result?.error) {
        log.auth.error('[Email] sign-in failed', { error: result.error });
        setError(t('invalidCredentials'));
      } else if (result?.url) {
        trackEvent('user_logged_in', { method: 'email', platform: 'web' });
        log.auth.warn('[Email] sign-in success, redirecting');
        window.location.href = result.url;
      }
    } catch (err) {
      log.auth.error('[Email] sign-in exception', err);
      setError(t('loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = (provider: 'apple' | 'google' | 'line' | 'kakao') => {
    log.auth.warn(`[OAuth] sign-in initiated`, { provider });
    setOauthError('');
    setOauthLoading(provider);

    // OAuth must do a full-page redirect to the provider's authorization page.
    // Do NOT use redirect: false — it blocks the redirect flow.
    signIn(provider, { callbackUrl }).catch((err) => {
      log.auth.error(`[OAuth] sign-in exception`, { provider, error: err });
      setOauthError(t('loginFailed'));
      setOauthLoading(null);
    });
  };

  if (showEmailForm) {
    return (
      <div className="w-full max-w-sm space-y-6">
        {/* Back + Logo */}
        <div className="text-center">
          <button
            onClick={() => setShowEmailForm(false)}
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
          <h1 className="text-2xl font-bold text-white">{t('emailLogin')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="relative space-y-4">
          {/* D8: Full-form loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-black/40 backdrop-blur-sm">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span className="text-sm font-medium text-white">{t('signingIn')}</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/20 border border-red-400/30 p-3 text-sm text-white">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="email" className="text-white/80">{t('emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
              onBlur={handleEmailBlur}
              className={`bg-white/15 border-white/20 text-white placeholder:text-white/40 focus:ring-white/30 h-12 rounded-[10px] ${emailError ? 'border-red-400' : ''}`}
            />
            {emailError && (
              <p className="text-xs text-red-400" role="alert">{emailError}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-white/80">{t('passwordLabel')}</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {t('forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(''); }}
                onBlur={handlePasswordBlur}
                className={`bg-white/15 border-white/20 text-white placeholder:text-white/40 focus:ring-white/30 h-12 rounded-[10px] pr-10 ${passwordError ? 'border-red-400' : ''}`}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordError && (
              <p className="text-xs text-red-400" role="alert">{passwordError}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-[10px] bg-white text-purple-600 font-semibold hover:bg-white/90"
            disabled={isLoading}
          >
            {t('login')}
          </Button>
        </form>

        <p className="text-center text-sm text-white/60">
          {t('noAccount')}{' '}
          <Link href="/register" className="text-white hover:underline">
            {t('freeRegister')}
          </Link>
        </p>
      </div>
    );
  }

  // Main login page — iOS style
  return (
    <div className="flex w-full max-w-sm flex-col items-center space-y-8 overflow-y-auto max-h-screen">
      {/* Logo */}
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/icons/app-icon.png"
          alt="Readmigo"
          width={120}
          height={120}
          className="rounded-3xl shadow-2xl"
          priority
        />
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">Readmigo</h1>
          <p className="mt-2 text-white/70">{t('tagline')}</p>
        </div>
      </div>

      {/* Primary Auth Buttons — region-adaptive */}
      <div className="w-full space-y-3">
        {/* OAuth error message */}
        {oauthError && (
          <div className="rounded-lg bg-red-500/20 border border-red-400/30 p-3 text-sm text-white text-center">
            {oauthError}
          </div>
        )}

        {/* LINE Sign In — Japan only */}
        {userRegion === 'jp' && (
          <Button
            className="w-full h-[50px] rounded-[10px] bg-[#06C755] text-white font-medium hover:bg-[#06C755]/90 text-base"
            onClick={() => handleOAuthSignIn('line')}
            disabled={!!oauthLoading}
          >
            {oauthLoading === 'line' ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <LineLogo className="mr-2 h-5 w-5" />
            )}
            {t('signInLine')}
          </Button>
        )}

        {/* Kakao Sign In — Korea only */}
        {userRegion === 'kr' && (
          <Button
            className="w-full h-[50px] rounded-[10px] bg-[#FEE500] text-[#000000D9] font-medium hover:bg-[#FEE500]/90 text-base"
            onClick={() => handleOAuthSignIn('kakao')}
            disabled={!!oauthLoading}
          >
            {oauthLoading === 'kakao' ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <KakaoLogo className="mr-2 h-5 w-5" />
            )}
            {t('signInKakao')}
          </Button>
        )}

        {/* Apple Sign In */}
        <Button
          className="w-full h-[50px] rounded-[10px] bg-white text-black font-medium hover:bg-white/90 text-base"
          onClick={() => handleOAuthSignIn('apple')}
          disabled={!!oauthLoading}
        >
          {oauthLoading === 'apple' ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <AppleLogo className="mr-2 h-5 w-5" />
          )}
          {t('signInApple')}
        </Button>

        {/* Google Sign In */}
        <Button
          className="w-full h-[50px] rounded-[10px] bg-white text-black font-medium hover:bg-white/90 text-base"
          onClick={() => handleOAuthSignIn('google')}
          disabled={!!oauthLoading}
        >
          {oauthLoading === 'google' ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {t('signInGoogle')}
        </Button>

        {/* Guest Mode — prominent button like iOS */}
        <Button
          className="w-full h-[50px] rounded-[10px] bg-white/15 text-white font-medium border border-white/30 hover:bg-white/25 text-base"
          onClick={() => {
            enterGuestMode();
            router.push('/');
          }}
        >
          {t('startReading')}
        </Button>

        {/* More Options Toggle */}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1 pt-1 text-sm text-white/60 hover:text-white/80 transition-colors"
          onClick={() => setShowMoreOptions(!showMoreOptions)}
        >
          {t('moreOptions')}
          {showMoreOptions ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* Secondary Options — expandable */}
        {showMoreOptions && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Phone Sign In */}
            <Button
              className="w-full h-[50px] rounded-[10px] bg-white/15 text-white font-medium border border-white/30 hover:bg-white/25 text-base"
              variant="ghost"
              onClick={() => router.push('/login/phone')}
            >
              <Phone className="mr-2 h-5 w-5" />
              {t('signInPhone')}
            </Button>

            {/* Email Sign In */}
            <Button
              className="w-full h-[50px] rounded-[10px] bg-white/15 text-white font-medium border border-white/30 hover:bg-white/25 text-base"
              variant="ghost"
              onClick={() => setShowEmailForm(true)}
            >
              <Mail className="mr-2 h-5 w-5" />
              {t('signInEmail')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
