'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Eye, EyeOff } from 'lucide-react';

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
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError('邮箱或密码错误');
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = (provider: 'apple' | 'google') => {
    signIn(provider, { callbackUrl });
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
            ← 返回
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
          <h1 className="text-2xl font-bold text-white">邮箱登录</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/20 border border-red-400/30 p-3 text-sm text-white">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/15 border-white/20 text-white placeholder:text-white/40 focus:ring-white/30 h-12 rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-white/80">密码</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                忘记密码?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/15 border-white/20 text-white placeholder:text-white/40 focus:ring-white/30 h-12 rounded-xl pr-10"
                required
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
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-white text-purple-600 font-semibold hover:bg-white/90"
            disabled={isLoading}
          >
            {isLoading ? '登录中...' : '登录'}
          </Button>
        </form>

        <p className="text-center text-sm text-white/60">
          还没有账户?{' '}
          <Link href="/register" className="text-white hover:underline">
            免费注册
          </Link>
        </p>
      </div>
    );
  }

  // Main login page — iOS style
  return (
    <div className="flex w-full max-w-sm flex-col items-center space-y-8">
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
          <p className="mt-2 text-white/70">AI-powered English reading companion</p>
        </div>
      </div>

      {/* Auth Buttons */}
      <div className="w-full space-y-3">
        {/* Apple Sign In */}
        <Button
          className="w-full h-[50px] rounded-xl bg-white text-black font-medium hover:bg-white/90 text-base"
          onClick={() => handleOAuthSignIn('apple')}
        >
          <AppleLogo className="mr-2 h-5 w-5" />
          Sign in with Apple
        </Button>

        {/* Google Sign In */}
        <Button
          className="w-full h-[50px] rounded-xl bg-white text-black font-medium hover:bg-white/90 text-base"
          onClick={() => handleOAuthSignIn('google')}
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </Button>

        {/* Email Sign In */}
        <Button
          className="w-full h-[50px] rounded-xl bg-white/15 text-white font-medium border border-white/30 hover:bg-white/25 text-base"
          variant="ghost"
          onClick={() => setShowEmailForm(true)}
        >
          <Mail className="mr-2 h-5 w-5" />
          Sign in with Email
        </Button>

        {/* Guest Mode */}
        <div className="pt-2 text-center">
          <Link
            href="/"
            className="text-sm text-white/60 underline underline-offset-4 hover:text-white/80 transition-colors"
          >
            Browse as Guest
          </Link>
        </div>
      </div>
    </div>
  );
}
