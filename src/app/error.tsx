'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <svg
            className="h-10 w-10 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          出了点问题
        </h2>
        <p className="mb-6 text-muted-foreground">
          {error.message || '页面加载时发生了意外错误，请稍后重试。'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => router.push('/explore')}>
            返回首页
          </Button>
          <Button onClick={() => reset()}>
            重新尝试
          </Button>
        </div>
      </div>
    </div>
  );
}
