'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, RefreshCw } from 'lucide-react';
import { useSubscription } from '../hooks/use-subscription';
import { useTranslations } from 'next-intl';

export function SubscriptionStatus() {
  const { tier, isPro, status, expiresAt, willRenew, isLoading } = useSubscription();
  const t = useTranslations('subscription');

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="h-5 w-16 rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isPro ? (
        <Badge className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0">
          <Crown className="mr-1 h-3 w-3" />
          Pro
        </Badge>
      ) : (
        <Badge variant="secondary">Free</Badge>
      )}
      {isPro && expiresAt && (
        <span className="text-xs text-muted-foreground">
          {willRenew ? (
            <>
              <RefreshCw className="inline mr-0.5 h-3 w-3" />
              {new Date(expiresAt).toLocaleDateString()}
            </>
          ) : (
            `Expires ${new Date(expiresAt).toLocaleDateString()}`
          )}
        </span>
      )}
    </div>
  );
}
