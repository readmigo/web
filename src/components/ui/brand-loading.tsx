'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Size mapping (matches iOS BrandLoadingView)                       */
/*  small: 28px  |  medium: 52px  |  large: 84px  |  extraLarge: 128 */
/* ------------------------------------------------------------------ */

const brandLoadingVariants = cva('inline-flex items-center justify-center', {
  variants: {
    size: {
      small: 'h-[28px] w-[28px]',
      medium: 'h-[52px] w-[52px]',
      large: 'h-[84px] w-[84px]',
      extraLarge: 'h-[128px] w-[128px]',
    },
  },
  defaultVariants: {
    size: 'medium',
  },
});

export interface BrandLoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof brandLoadingVariants> {
  /** Size of the loading indicator */
  size?: 'small' | 'medium' | 'large' | 'extraLarge';
}

/**
 * Branded loading indicator featuring an animated headphone + book icon
 * with floating music notes -- a Web port of the iOS BrandLoadingView.
 *
 * Uses pure CSS animations (no external animation library).
 *
 * Usage:
 *   <BrandLoading size="small" />
 *   <BrandLoading size="medium" />
 *   <BrandLoading size="large" />
 *   <BrandLoading size="extraLarge" />
 */
function BrandLoading({ size = 'medium', className, ...props }: BrandLoadingProps) {
  const showDetails = size !== 'small';

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(brandLoadingVariants({ size }), className)}
      {...props}
    >
      <svg
        viewBox="0 0 88 92"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--brand-blue, #8BB9FF)" />
            <stop offset="50%" stopColor="var(--brand-purple, #B9B3F5)" />
            <stop offset="100%" stopColor="var(--brand-pink, #F6B6E8)" />
          </linearGradient>
          <linearGradient id="brand-grad-v" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--brand-purple, #B9B3F5)" />
            <stop offset="100%" stopColor="var(--brand-blue, #8BB9FF)" />
          </linearGradient>
        </defs>

        {/* ── Headphone band (breathing animation via CSS) ── */}
        <g className="brand-loading-breath">
          <path
            d="M14 48 Q14 14 44 14 Q74 14 74 48"
            stroke="url(#brand-grad)"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* ── Left ear cup ── */}
        <rect
          x="6"
          y="42"
          width="18"
          height="26"
          rx="7"
          fill="url(#brand-grad-v)"
        />
        {showDetails && (
          <>
            <rect
              x="9"
              y="46"
              width="12"
              height="18"
              rx="5"
              stroke="var(--brand-pink, #F6B6E8)"
              strokeOpacity="0.4"
              strokeWidth="0.8"
              fill="none"
            />
            <rect
              x="10.5"
              y="48"
              width="9"
              height="14"
              rx="4"
              fill="var(--brand-blue, #8BB9FF)"
              fillOpacity="0.3"
            />
          </>
        )}

        {/* ── Right ear cup ── */}
        <rect
          x="64"
          y="42"
          width="18"
          height="26"
          rx="7"
          fill="url(#brand-grad-v)"
        />
        {showDetails && (
          <>
            <rect
              x="67"
              y="46"
              width="12"
              height="18"
              rx="5"
              stroke="var(--brand-pink, #F6B6E8)"
              strokeOpacity="0.4"
              strokeWidth="0.8"
              fill="none"
            />
            <rect
              x="68.5"
              y="48"
              width="9"
              height="14"
              rx="4"
              fill="var(--brand-blue, #8BB9FF)"
              fillOpacity="0.3"
            />
          </>
        )}

        {/* ── Open book ── */}
        <g>
          {/* Left page */}
          <path
            d="M30 40 Q30 36 32.5 36 L42 36 L42 62 Q37 61 30 62 Z"
            fill="currentColor"
            className="text-card"
            stroke="var(--brand-purple, #B9B3F5)"
            strokeOpacity="0.3"
            strokeWidth="0.8"
          />
          {/* Right page */}
          <path
            d="M46 36 L55.5 36 Q58 36 58 40 L58 62 Q51 61 46 62 Z"
            fill="currentColor"
            className="text-card"
            stroke="var(--brand-purple, #B9B3F5)"
            strokeOpacity="0.3"
            strokeWidth="0.8"
          />
          {/* Spine */}
          <path
            d="M42 36 Q44 34 46 36 L46 62 Q44 64 42 62 Z"
            fill="var(--brand-purple, #B9B3F5)"
            fillOpacity="0.15"
            stroke="var(--brand-purple, #B9B3F5)"
            strokeOpacity="0.2"
            strokeWidth="0.6"
          />

          {/* Text lines on left page (animate highlight) */}
          {showDetails && (
            <>
              <rect x="32.5" y="43" width="7.5" height="1.2" rx="0.6" fill="var(--brand-purple, #B9B3F5)" fillOpacity="0.2">
                <animate attributeName="fill-opacity" values="0.2;0.7;0.2" dur="2.5s" begin="0s" repeatCount="indefinite" />
              </rect>
              <rect x="32.5" y="47" width="7.5" height="1.2" rx="0.6" fill="var(--brand-blue, #8BB9FF)" fillOpacity="0.2">
                <animate attributeName="fill-opacity" values="0.2;0.7;0.2" dur="2.5s" begin="0.3s" repeatCount="indefinite" />
              </rect>
              <rect x="32.5" y="51" width="7.5" height="1.2" rx="0.6" fill="var(--brand-purple, #B9B3F5)" fillOpacity="0.2">
                <animate attributeName="fill-opacity" values="0.2;0.7;0.2" dur="2.5s" begin="0.6s" repeatCount="indefinite" />
              </rect>
              <rect x="32.5" y="55" width="7.5" height="1.2" rx="0.6" fill="var(--brand-blue, #8BB9FF)" fillOpacity="0.2">
                <animate attributeName="fill-opacity" values="0.2;0.7;0.2" dur="2.5s" begin="0.9s" repeatCount="indefinite" />
              </rect>

              {/* Text lines on right page */}
              <rect x="48.5" y="43" width="7.5" height="1.2" rx="0.6" fill="var(--brand-pink, #F6B6E8)" fillOpacity="0.2">
                <animate attributeName="fill-opacity" values="0.2;0.7;0.2" dur="2.5s" begin="1.2s" repeatCount="indefinite" />
              </rect>
              <rect x="48.5" y="47" width="7.5" height="1.2" rx="0.6" fill="var(--brand-purple, #B9B3F5)" fillOpacity="0.2">
                <animate attributeName="fill-opacity" values="0.2;0.7;0.2" dur="2.5s" begin="1.5s" repeatCount="indefinite" />
              </rect>
              <rect x="48.5" y="51" width="7.5" height="1.2" rx="0.6" fill="var(--brand-pink, #F6B6E8)" fillOpacity="0.2">
                <animate attributeName="fill-opacity" values="0.2;0.7;0.2" dur="2.5s" begin="1.8s" repeatCount="indefinite" />
              </rect>
              <rect x="48.5" y="55" width="5" height="1.2" rx="0.6" fill="var(--brand-purple, #B9B3F5)" fillOpacity="0.2">
                <animate attributeName="fill-opacity" values="0.2;0.7;0.2" dur="2.5s" begin="2.1s" repeatCount="indefinite" />
              </rect>
            </>
          )}

          {/* Page flip animation */}
          {showDetails && (
            <path
              d="M44 36 Q48 34 52 36 L52 62 Q48 60 44 62 Z"
              fill="currentColor"
              className="text-card brand-loading-page-flip"
              stroke="var(--brand-purple, #B9B3F5)"
              strokeOpacity="0.2"
              strokeWidth="0.6"
            />
          )}
        </g>

        {/* ── Floating music notes ── */}
        {showDetails && (
          <>
            <text
              className="brand-loading-note-1"
              x="18"
              y="30"
              fontSize="11"
              fill="var(--brand-pink, #F6B6E8)"
            >
              &#9835;
            </text>
            <text
              className="brand-loading-note-2"
              x="8"
              y="22"
              fontSize="10"
              fill="var(--brand-purple, #B9B3F5)"
            >
              &#9834;
            </text>
            <text
              className="brand-loading-note-3"
              x="68"
              y="28"
              fontSize="11"
              fill="var(--brand-blue, #8BB9FF)"
            >
              &#9834;
            </text>
            <text
              className="brand-loading-note-4"
              x="76"
              y="20"
              fontSize="10"
              fill="var(--brand-pink, #F6B6E8)"
            >
              &#9835;
            </text>
            <text
              className="brand-loading-note-5"
              x="40"
              y="10"
              fontSize="10"
              fill="var(--brand-purple, #B9B3F5)"
            >
              &#9834;
            </text>
          </>
        )}
      </svg>

      {/* CSS keyframe animations */}
      <style>{`
        /* Breathing animation on the headphone band */
        .brand-loading-breath {
          animation: brand-breath 2s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes brand-breath {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        /* Page flip */
        .brand-loading-page-flip {
          animation: brand-flip 2.5s ease-in-out infinite;
          transform-origin: 44px 49px;
        }
        @keyframes brand-flip {
          0%, 40% { transform: scaleX(1); opacity: 0; }
          45% { opacity: 0.8; }
          50% { transform: scaleX(0); opacity: 0.9; }
          55% { opacity: 0.8; }
          60%, 100% { transform: scaleX(-1); opacity: 0; }
        }

        /* Music notes floating upward with fade */
        .brand-loading-note-1 {
          animation: brand-float-1 1.25s ease-out infinite;
        }
        .brand-loading-note-2 {
          animation: brand-float-2 1.4s ease-out infinite 0.175s;
        }
        .brand-loading-note-3 {
          animation: brand-float-3 1.15s ease-out infinite 0.35s;
        }
        .brand-loading-note-4 {
          animation: brand-float-4 1.3s ease-out infinite 0.525s;
        }
        .brand-loading-note-5 {
          animation: brand-float-5 1.2s ease-out infinite 0.1s;
        }

        @keyframes brand-float-1 {
          0%   { opacity: 0; transform: translate(0, 0); }
          15%  { opacity: 0.85; }
          60%  { opacity: 0.7; }
          100% { opacity: 0; transform: translate(-6px, -14px); }
        }
        @keyframes brand-float-2 {
          0%   { opacity: 0; transform: translate(0, 0); }
          15%  { opacity: 0.85; }
          60%  { opacity: 0.7; }
          100% { opacity: 0; transform: translate(-4px, -16px); }
        }
        @keyframes brand-float-3 {
          0%   { opacity: 0; transform: translate(0, 0); }
          15%  { opacity: 0.85; }
          60%  { opacity: 0.7; }
          100% { opacity: 0; transform: translate(6px, -12px); }
        }
        @keyframes brand-float-4 {
          0%   { opacity: 0; transform: translate(0, 0); }
          15%  { opacity: 0.85; }
          60%  { opacity: 0.7; }
          100% { opacity: 0; transform: translate(4px, -15px); }
        }
        @keyframes brand-float-5 {
          0%   { opacity: 0; transform: translate(0, 0); }
          15%  { opacity: 0.85; }
          60%  { opacity: 0.7; }
          100% { opacity: 0; transform: translate(0, -14px); }
        }
      `}</style>
    </div>
  );
}

BrandLoading.displayName = 'BrandLoading';

export { BrandLoading, brandLoadingVariants };
