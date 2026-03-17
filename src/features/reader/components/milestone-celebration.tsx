'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface MilestoneCelebrationProps {
  /** Progress value 0–1 */
  progress: number;
}

const MILESTONES = [0.25, 0.5, 0.75, 1.0] as const;
type Milestone = (typeof MILESTONES)[number];

const MILESTONE_LABELS: Record<Milestone, string> = {
  0.25: '25% Complete!',
  0.5: 'Halfway There!',
  0.75: '75% Complete!',
  1.0: 'Book Finished!',
};

const PARTICLE_COLORS = [
  'bg-yellow-400',
  'bg-pink-500',
  'bg-blue-400',
  'bg-green-400',
  'bg-purple-500',
  'bg-orange-400',
  'bg-red-400',
  'bg-cyan-400',
];

const PARTICLE_COUNT = 24;

interface Particle {
  id: number;
  color: string;
  angle: number;
  distance: number;
  size: number;
  duration: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    angle: (360 / PARTICLE_COUNT) * i + Math.random() * 15 - 7.5,
    distance: 80 + Math.random() * 60,
    size: 6 + Math.floor(Math.random() * 6),
    duration: 700 + Math.random() * 400,
  }));
}

export function MilestoneCelebration({ progress }: MilestoneCelebrationProps) {
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearedRef = useRef<Set<Milestone>>(new Set());

  useEffect(() => {
    for (const milestone of MILESTONES) {
      if (progress >= milestone && !clearedRef.current.has(milestone)) {
        clearedRef.current.add(milestone);
        setActiveMilestone(milestone);
        setParticles(generateParticles());
        setVisible(true);

        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = setTimeout(() => {
          setVisible(false);
          setActiveMilestone(null);
        }, 2800);
      }
    }
  }, [progress]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  if (!activeMilestone || !visible) return null;

  return (
    <div
      aria-live="polite"
      aria-label={MILESTONE_LABELS[activeMilestone]}
      className={cn(
        'fixed inset-0 z-[60] flex items-center justify-center pointer-events-none',
        'animate-in fade-in duration-300'
      )}
    >
      {/* Backdrop pulse ring */}
      <div className="relative flex items-center justify-center">
        {/* Particles */}
        {particles.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const tx = Math.cos(rad) * p.distance;
          const ty = Math.sin(rad) * p.distance;
          return (
            <div
              key={p.id}
              className={cn('absolute rounded-full', p.color)}
              style={{
                width: p.size,
                height: p.size,
                animation: `particle-burst ${p.duration}ms ease-out forwards`,
                // CSS custom properties used by the keyframe below
                ['--tx' as string]: `${tx}px`,
                ['--ty' as string]: `${ty}px`,
              }}
            />
          );
        })}

        {/* Central badge */}
        <div
          className={cn(
            'relative z-10 flex flex-col items-center justify-center',
            'rounded-2xl bg-background/95 backdrop-blur-sm shadow-2xl border',
            'px-8 py-5 min-w-[180px]',
            'animate-in zoom-in-75 duration-300'
          )}
        >
          <span className="text-4xl mb-1" role="img" aria-hidden>
            {activeMilestone === 1.0 ? '🎉' : '⭐'}
          </span>
          <p className="text-lg font-bold text-center text-foreground">
            {MILESTONE_LABELS[activeMilestone]}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Keep reading!</p>
        </div>
      </div>

      <style>{`
        @keyframes particle-burst {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          80% { opacity: 0.8; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
