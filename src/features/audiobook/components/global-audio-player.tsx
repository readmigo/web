'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MiniPlayer } from './mini-player';
import { AudioPlayer } from './audio-player';
import { useMediaSession } from '../hooks/use-media-session';
import { useAudioPlayerStore } from '../stores/audio-player-store';
import { useAudioUsageTracker } from '@/features/subscription/hooks/use-audio-usage-tracker';
import { AudioLimitDialog } from '@/features/subscription/components/audio-limit-dialog';
import { PaywallView } from '@/features/subscription/components/paywall-view';

/**
 * Global audio player component that renders the mini player at the bottom
 * and the full player as a sheet that slides up.
 *
 * Add this component to your main layout to enable audio playback across all pages.
 */
export function GlobalAudioPlayer() {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const { data: session } = useSession();
  const isGuest = !session?.user;

  const shouldOpenFullPlayer = useAudioPlayerStore((s) => s.shouldOpenFullPlayer);
  const clearShouldOpenFullPlayer = useAudioPlayerStore((s) => s.clearShouldOpenFullPlayer);

  // Auto-open full player when requested (e.g., from detail page "Start Listening")
  useEffect(() => {
    if (shouldOpenFullPlayer) {
      setIsPlayerOpen(true);
      clearShouldOpenFullPlayer();
    }
  }, [shouldOpenFullPlayer, clearShouldOpenFullPlayer]);

  // Initialize Media Session API
  useMediaSession();

  const handleLimitReached = useCallback(() => {
    setShowLimitDialog(true);
  }, []);

  const { dailySecondsUsed, dailyLimitSeconds } = useAudioUsageTracker({
    onLimitReached: handleLimitReached,
  });

  return (
    <>
      <MiniPlayer onExpand={() => setIsPlayerOpen(true)} />
      <AudioPlayer
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
      />

      <AudioLimitDialog
        open={showLimitDialog}
        onDismiss={() => setShowLimitDialog(false)}
        onUpgrade={() => setShowPaywall(true)}
        dailySecondsUsed={dailySecondsUsed}
        dailyLimitSeconds={dailyLimitSeconds}
        isGuest={isGuest}
      />

      {showPaywall && (
        <PaywallView
          trigger="audioLimitReached"
          onDismiss={() => setShowPaywall(false)}
        />
      )}
    </>
  );
}
