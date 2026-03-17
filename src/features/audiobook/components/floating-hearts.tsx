'use client';

import { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeartParticle {
  id: number;
  // horizontal drift in px relative to origin, positive = right
  driftX: number;
  // rotation in degrees
  rotate: number;
  // font-size in px
  size: number;
  // animation duration in ms
  duration: number;
  // animation delay in ms
  delay: number;
  // heart colour
  color: string;
}

interface FloatingHeartsProps {
  /** Set to true to fire a burst of floating hearts. Resets itself after the animation completes. */
  triggered: boolean;
  /** Called after all particles have finished animating so the parent can reset its trigger state. */
  onAnimationEnd?: () => void;
  /**
   * Ref to the element the hearts should originate from.
   * If omitted the hearts appear at the component's own bounding box bottom-centre.
   */
  originRef?: React.RefObject<HTMLElement | null>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HEART_COLORS = [
  '#ff4d6d', // red
  '#ff6b9d', // hot pink
  '#ff9ebc', // light pink
  '#c77dff', // purple
  '#ff6b35', // orange
  '#ff8fa3', // rose
  '#da77f2', // violet
];

const MIN_PARTICLES = 18;
const MAX_PARTICLES = 25;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

function createParticles(): HeartParticle[] {
  const count = randomInt(MIN_PARTICLES, MAX_PARTICLES);
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    driftX: randomBetween(-80, 80),
    rotate: randomBetween(-45, 45),
    size: randomBetween(14, 28),
    duration: randomBetween(900, 1600),
    delay: randomBetween(0, 300),
    color: HEART_COLORS[randomInt(0, HEART_COLORS.length - 1)],
  }));
}

// ─── Keyframe style injection ─────────────────────────────────────────────────

const STYLE_ID = 'floating-hearts-keyframes';

function ensureKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes fh-float-up {
      0% {
        opacity: 1;
        transform: translateY(0px) translateX(var(--fh-drift-x)) rotate(var(--fh-rotate)) scale(0.4);
      }
      20% {
        opacity: 1;
        transform: translateY(-30px) translateX(calc(var(--fh-drift-x) * 0.4)) rotate(var(--fh-rotate)) scale(1);
      }
      80% {
        opacity: 0.6;
      }
      100% {
        opacity: 0;
        transform: translateY(-160px) translateX(var(--fh-drift-x)) rotate(calc(var(--fh-rotate) * 2)) scale(0.7);
      }
    }
  `;
  document.head.appendChild(style);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BurstState {
  batch: number;
  particles: HeartParticle[];
  originPos: { x: number; y: number };
}

export function FloatingHearts({ triggered, onAnimationEnd, originRef }: FloatingHeartsProps) {
  const [burst, setBurst] = useState<BurstState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(0);
  const batchCounterRef = useRef(0);

  // Inject keyframes once on mount
  useEffect(() => {
    ensureKeyframes();
  }, []);

  // Fire a new burst whenever `triggered` flips to true
  useEffect(() => {
    if (!triggered) return;

    let x = 0;
    let y = 0;

    if (originRef?.current) {
      const rect = originRef.current.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.bottom;
    }

    batchCounterRef.current += 1;
    completedRef.current = 0;

    setBurst({
      batch: batchCounterRef.current,
      particles: createParticles(),
      originPos: { x, y },
    });
  }, [triggered, originRef]);

  const handleParticleEnd = () => {
    if (!burst) return;
    completedRef.current += 1;
    if (completedRef.current >= burst.particles.length) {
      setBurst(null);
      onAnimationEnd?.();
    }
  };

  return (
    <>
      {/* Hidden anchor used when no originRef is provided */}
      <div ref={containerRef} aria-hidden="true" />

      {/* Particles rendered in a fixed layer to escape overflow:hidden parents */}
      {burst && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          {burst.particles.map((p) => (
            <span
              key={`${burst.batch}-${p.id}`}
              onAnimationEnd={handleParticleEnd}
              style={
                {
                  position: 'fixed',
                  top: burst.originPos.y,
                  left: burst.originPos.x,
                  fontSize: p.size,
                  color: p.color,
                  lineHeight: 1,
                  userSelect: 'none',
                  pointerEvents: 'none',
                  '--fh-drift-x': `${p.driftX}px`,
                  '--fh-rotate': `${p.rotate}deg`,
                  animation: `fh-float-up ${p.duration}ms ease-out ${p.delay}ms forwards`,
                } as React.CSSProperties
              }
            >
              ♥
            </span>
          ))}
        </div>
      )}
    </>
  );
}
