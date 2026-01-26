'use client';

import { useState } from 'react';
import { MiniPlayer } from './mini-player';
import { AudioPlayer } from './audio-player';
import { useMediaSession } from '../hooks/use-media-session';

/**
 * Global audio player component that renders the mini player at the bottom
 * and the full player as a sheet that slides up.
 *
 * Add this component to your main layout to enable audio playback across all pages.
 */
export function GlobalAudioPlayer() {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  // Initialize Media Session API
  useMediaSession();

  return (
    <>
      <MiniPlayer onExpand={() => setIsPlayerOpen(true)} />
      <AudioPlayer
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
      />
    </>
  );
}
