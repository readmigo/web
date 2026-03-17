'use client';

import { useRef, useState, useEffect, useCallback, useId } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  X,
  Loader2,
  ChevronUp,
} from 'lucide-react';
import { useAudioPlayerStore } from '../stores/audio-player-store';

/**
 * B7: Floating Mini Player
 *
 * A draggable floating ball that sits over the reading UI when an audiobook is
 * active. Behaviour:
 *   - Collapsed: 56 × 56 px circle showing the cover thumbnail + play/pause overlay.
 *   - Expanded: pill-shaped control strip with seek-back / play-pause / seek-forward / close.
 *   - Draggable anywhere on screen via pointer events.
 *   - On drag end, snaps to the nearest vertical screen edge (left / right).
 *   - A tap (< 8 px travel) on the collapsed ball toggles expanded state.
 */

const SNAP_MARGIN = 16; // px gap from screen edge after snap
const TAP_MOVE_THRESHOLD = 8; // px — under this is treated as a tap, not a drag

interface FloatingMiniPlayerProps {
  onExpand: () => void;
}

export function FloatingMiniPlayer({ onExpand }: FloatingMiniPlayerProps) {
  const {
    audiobook,
    isPlaying,
    isLoading,
    isVisible,
    togglePlay,
    seekBackward,
    seekForward,
    unloadAudiobook,
  } = useAudioPlayerStore();

  const labelId = useId();

  const containerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  // Position state — initialise to bottom-right
  const posRef = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const initialised = useRef(false);

  // Drag tracking refs (all mutable, no re-render during drag)
  const isDragging = useRef(false);
  const dragStartClient = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const totalMove = useRef(0);

  // Initialise to bottom-right corner once
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    const el = containerRef.current;
    const w = el?.offsetWidth ?? 56;
    const h = el?.offsetHeight ?? 56;
    const x = window.innerWidth - w - SNAP_MARGIN;
    const y = window.innerHeight - h - SNAP_MARGIN - 80; // above typical bottom nav
    posRef.current = { x, y };
    setPos({ x, y });
  }, []);

  const snapToEdge = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const { x, y } = posRef.current;
    const midScreen = window.innerWidth / 2;
    const snappedX = x + w / 2 < midScreen ? SNAP_MARGIN : window.innerWidth - w - SNAP_MARGIN;
    const clampedY = Math.min(Math.max(y, SNAP_MARGIN), window.innerHeight - h - SNAP_MARGIN);
    posRef.current = { x: snappedX, y: clampedY };
    setPos({ x: snappedX, y: clampedY });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Only initiate drag from the container background, not from buttons inside
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    totalMove.current = 0;
    dragStartClient.current = { x: e.clientX, y: e.clientY };
    dragStartPos.current = { ...posRef.current };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartClient.current.x;
    const dy = e.clientY - dragStartClient.current.y;
    totalMove.current = Math.sqrt(dx * dx + dy * dy);

    const el = containerRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const newX = Math.min(Math.max(dragStartPos.current.x + dx, 0), window.innerWidth - w);
    const newY = Math.min(Math.max(dragStartPos.current.y + dy, 0), window.innerHeight - h);
    posRef.current = { x: newX, y: newY };
    setPos({ x: newX, y: newY });
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (totalMove.current < TAP_MOVE_THRESHOLD) {
      // Tap — toggle expanded
      setExpanded((v) => !v);
    } else {
      snapToEdge();
    }
  }, [snapToEdge]);

  if (!isVisible || !audiobook) return null;

  return (
    <div
      ref={containerRef}
      role="region"
      aria-labelledby={labelId}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 60,
        touchAction: 'none',
        userSelect: 'none',
        cursor: isDragging.current ? 'grabbing' : 'grab',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <span id={labelId} className="sr-only">
        {audiobook.title}
      </span>

      {expanded ? (
        <ExpandedControls
          audiobook={audiobook}
          isPlaying={isPlaying}
          isLoading={isLoading}
          onTogglePlay={togglePlay}
          onSeekBack={() => seekBackward(15)}
          onSeekForward={() => seekForward(30)}
          onExpand={onExpand}
          onClose={unloadAudiobook}
        />
      ) : (
        <CollapsedBall
          coverUrl={audiobook.coverUrl}
          title={audiobook.title}
          isPlaying={isPlaying}
          isLoading={isLoading}
          onTogglePlay={togglePlay}
        />
      )}
    </div>
  );
}

// ─── Collapsed Ball ────────────────────────────────────────────────────────────

interface CollapsedBallProps {
  coverUrl?: string;
  title: string;
  isPlaying: boolean;
  isLoading: boolean;
  onTogglePlay: () => void;
}

function CollapsedBall({ coverUrl, title, isPlaying, isLoading, onTogglePlay }: CollapsedBallProps) {
  return (
    <div className="relative h-14 w-14 overflow-hidden rounded-full shadow-xl ring-2 ring-background">
      {coverUrl ? (
        <Image src={coverUrl} alt={title} fill className="object-cover" sizes="56px" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-primary">
          <span className="text-lg font-bold text-primary-foreground">{title.charAt(0)}</span>
        </div>
      )}
      {/* Play/pause overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/35">
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="flex items-center justify-center"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5 text-white" />
          ) : (
            <Play className="h-5 w-5 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Expanded Pill ─────────────────────────────────────────────────────────────

interface ExpandedControlsProps {
  audiobook: { coverUrl?: string; title: string };
  isPlaying: boolean;
  isLoading: boolean;
  onTogglePlay: () => void;
  onSeekBack: () => void;
  onSeekForward: () => void;
  onExpand: () => void;
  onClose: () => void;
}

function ExpandedControls({
  audiobook,
  isPlaying,
  isLoading,
  onTogglePlay,
  onSeekBack,
  onSeekForward,
  onExpand,
  onClose,
}: ExpandedControlsProps) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-background/95 px-3 py-2 shadow-xl ring-1 ring-border backdrop-blur-sm">
      {/* Cover thumbnail */}
      <button
        onClick={(e) => { e.stopPropagation(); onExpand(); }}
        aria-label="Open full player"
        className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full"
      >
        {audiobook.coverUrl ? (
          <Image src={audiobook.coverUrl} alt={audiobook.title} fill className="object-cover" sizes="36px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary">
            <span className="text-xs font-bold text-primary-foreground">{audiobook.title.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
          <ChevronUp className="h-4 w-4 text-white" />
        </div>
      </button>

      {/* Seek back 15s */}
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={(e) => { e.stopPropagation(); onSeekBack(); }}
        aria-label="Seek back 15 seconds"
      >
        <RotateCcw className="h-4 w-4" />
        <span className="absolute text-[8px] font-bold leading-none">15</span>
      </Button>

      {/* Play / Pause */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
        disabled={isLoading}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Seek forward 30s */}
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={(e) => { e.stopPropagation(); onSeekForward(); }}
        aria-label="Seek forward 30 seconds"
      >
        <RotateCw className="h-4 w-4" />
        <span className="absolute text-[8px] font-bold leading-none">30</span>
      </Button>

      {/* Close */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close player"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
