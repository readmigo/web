'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const SCALE_STEP = 0.25;
const DOUBLE_TAP_DELAY_MS = 300;
const DOUBLE_TAP_ZOOM = 2.5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImageViewerProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

interface Point {
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Computes the max pan offset so the image cannot be dragged outside viewport. */
function computeMaxOffset(scale: number, naturalSize: number, viewportSize: number): number {
  const scaled = naturalSize * scale;
  return Math.max(0, (scaled - viewportSize) / 2);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImageViewer({ images, initialIndex, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  // isDragging is used in render (cursor style, transition), so it must be state.
  const [isDragging, setIsDragging] = useState(false);

  // Pointer tracking refs — stored in refs to avoid stale closure issues in event handlers
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef<Point>({ x: 0, y: 0 });
  const activePointerIdsRef = useRef<number[]>([]);
  const lastPinchDistanceRef = useRef<number | null>(null);
  const lastPinchMidpointRef = useRef<Point | null>(null);
  const lastTapTimeRef = useRef(0);
  const lastTapPointRef = useRef<Point>({ x: 0, y: 0 });

  // Image natural dimensions — used to constrain pan offset
  const imageNaturalRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep derived state in refs for use inside pointer callbacks
  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { offsetRef.current = offset; }, [offset]);

  // Reset zoom/pan when navigating to a new image
  const resetTransform = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
    resetTransform();
  }, [resetTransform]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  const goNext = useCallback(() => {
    if (currentIndex < images.length - 1) goTo(currentIndex + 1);
  }, [currentIndex, images.length, goTo]);

  // Apply a new scale, keeping a focal point fixed on screen
  const applyZoom = useCallback((
    nextScale: number,
    focal: Point,
    containerRect: DOMRect,
  ) => {
    const clamped = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    const prevScale = scaleRef.current;
    const prevOffset = offsetRef.current;

    // Focal point relative to container centre
    const cx = focal.x - containerRect.left - containerRect.width / 2;
    const cy = focal.y - containerRect.top - containerRect.height / 2;

    // New offset: scale the existing offset + shift focal point
    const ratio = clamped / prevScale;
    const nx = (prevOffset.x + cx) * ratio - cx;
    const ny = (prevOffset.y + cy) * ratio - cy;

    // Clamp to image bounds
    const maxX = computeMaxOffset(clamped, imageNaturalRef.current.width, containerRect.width);
    const maxY = computeMaxOffset(clamped, imageNaturalRef.current.height, containerRect.height);

    setScale(clamped);
    setOffset({
      x: clamp(nx, -maxX, maxX),
      y: clamp(ny, -maxY, maxY),
    });
  }, []);

  // Wheel zoom (desktop)
  const handleWheel = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const delta = e.deltaY < 0 ? SCALE_STEP : -SCALE_STEP;
    applyZoom(scaleRef.current + delta, { x: e.clientX, y: e.clientY }, container.getBoundingClientRect());
  }, [applyZoom]);

  // Pointer events — handles both mouse drag and touch pinch/pan
  const handlePointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    activePointerIdsRef.current.push(e.pointerId);

    if (activePointerIdsRef.current.length === 1) {
      // Single pointer: prepare for drag or double-tap
      isDraggingRef.current = false;
      setIsDragging(false);
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      lastPinchDistanceRef.current = null;
      lastPinchMidpointRef.current = null;
    }
  }, []);

  const handlePointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    if (activePointerIdsRef.current.length >= 2) {
      // Pinch-zoom: we need current positions of both active pointers.
      // Because React synthetic events only carry one pointer at a time, we store
      // positions in a map keyed by pointerId.
      // We simplify by tracking the two-pointer case via the stored last midpoint.
      // For robust pinch tracking we use a PointerEvent cache via DOM listeners below.
      return;
    }

    // Single-pointer drag
    if (scaleRef.current <= 1) {
      // No drag when not zoomed in
      isDraggingRef.current = false;
      setIsDragging(false);
      return;
    }

    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = true;
    setIsDragging(true);

    const rect = container.getBoundingClientRect();
    const maxX = computeMaxOffset(scaleRef.current, imageNaturalRef.current.width, rect.width);
    const maxY = computeMaxOffset(scaleRef.current, imageNaturalRef.current.height, rect.height);

    setOffset((prev) => ({
      x: clamp(prev.x + dx, -maxX, maxX),
      y: clamp(prev.y + dy, -maxY, maxY),
    }));
  }, []);

  const handlePointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    activePointerIdsRef.current = activePointerIdsRef.current.filter((id) => id !== e.pointerId);
    lastPinchDistanceRef.current = null;
    lastPinchMidpointRef.current = null;

    if (!isDraggingRef.current) {
      // Double-tap to zoom
      const now = Date.now();
      const point: Point = { x: e.clientX, y: e.clientY };
      const prev = lastTapTimeRef.current;
      const prevPoint = lastTapPointRef.current;
      const isDoubleTap =
        now - prev < DOUBLE_TAP_DELAY_MS &&
        Math.abs(point.x - prevPoint.x) < 30 &&
        Math.abs(point.y - prevPoint.y) < 30;

      if (isDoubleTap) {
        const container = containerRef.current;
        if (container) {
          const nextScale = scaleRef.current > 1 ? 1 : DOUBLE_TAP_ZOOM;
          applyZoom(nextScale, point, container.getBoundingClientRect());
          if (nextScale === 1) setOffset({ x: 0, y: 0 });
        }
        lastTapTimeRef.current = 0;
      } else {
        lastTapTimeRef.current = now;
        lastTapPointRef.current = point;
      }
    }

    isDraggingRef.current = false;
    setIsDragging(false);
  }, [applyZoom]);

  // DOM-level listener for pinch (two simultaneous pointers)
  // React synthetic events only fire for one pointer at a time, so we use native listeners.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pointerCache = new Map<number, PointerEvent>();

    const onDown = (e: PointerEvent) => {
      pointerCache.set(e.pointerId, e);
    };

    const onMove = (e: PointerEvent) => {
      pointerCache.set(e.pointerId, e);

      if (pointerCache.size < 2) return;

      const [p1, p2] = [...pointerCache.values()];
      const dx = p2.clientX - p1.clientX;
      const dy = p2.clientY - p1.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const mid: Point = {
        x: (p1.clientX + p2.clientX) / 2,
        y: (p1.clientY + p2.clientY) / 2,
      };

      if (lastPinchDistanceRef.current !== null) {
        const ratio = dist / lastPinchDistanceRef.current;
        const rect = container.getBoundingClientRect();
        applyZoom(scaleRef.current * ratio, mid, rect);
      }

      lastPinchDistanceRef.current = dist;
      lastPinchMidpointRef.current = mid;
    };

    const onUp = (e: PointerEvent) => {
      pointerCache.delete(e.pointerId);
      if (pointerCache.size < 2) {
        lastPinchDistanceRef.current = null;
        lastPinchMidpointRef.current = null;
      }
    };

    container.addEventListener('pointerdown', onDown);
    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerup', onUp);
    container.addEventListener('pointercancel', onUp);

    return () => {
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerup', onUp);
      container.removeEventListener('pointercancel', onUp);
    };
  }, [applyZoom]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goNext();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goPrev, goNext]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const hasMultiple = images.length > 1;
  const src = images[currentIndex];

  const viewer = (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      {/* Header */}
      <div className="relative z-10 flex h-14 shrink-0 items-center justify-between px-4">
        {/* Left spacer to balance close button */}
        <div className="w-9" aria-hidden="true" />

        {hasMultiple && (
          <span className="text-sm font-medium text-white/80" aria-live="polite">
            {currentIndex + 1} / {images.length}
          </span>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-white hover:bg-white/10 hover:text-white"
          onClick={onClose}
          aria-label="Close image viewer"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Image area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {/* Left arrow */}
        {hasMultiple && currentIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 z-10 h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
            onClick={goPrev}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        {/* Zoomable / pannable container */}
        <div
          ref={containerRef}
          className="h-full w-full touch-none select-none"
          style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={src}
            src={src}
            alt={`Image ${currentIndex + 1}`}
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              imageNaturalRef.current = {
                width: img.naturalWidth || img.offsetWidth,
                height: img.naturalHeight || img.offsetHeight,
              };
            }}
            className="h-full w-full object-contain"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 150ms ease',
              willChange: 'transform',
            }}
          />
        </div>

        {/* Right arrow */}
        {hasMultiple && currentIndex < images.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 z-10 h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
            onClick={goNext}
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Bottom dot indicators */}
      {hasMultiple && (
        <div className="flex h-12 shrink-0 items-center justify-center gap-2" role="tablist" aria-label="Image navigation">
          {images.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === currentIndex}
              aria-label={`Go to image ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );

  return createPortal(viewer, document.body);
}
