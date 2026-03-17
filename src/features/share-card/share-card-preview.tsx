'use client';

import { forwardRef } from 'react';
import { SHARE_CARD_THEMES } from './types';
import type { ShareCardTheme, ShareCardContent } from './types';

interface ShareCardPreviewProps {
  theme: ShareCardTheme;
  content: ShareCardContent;
}

/**
 * Determines font size based on quote length — 4 tiers matching iOS behaviour.
 */
function getQuoteFontSize(charCount: number): string {
  if (charCount > 200) return '0.85rem';
  if (charCount > 100) return '1rem';
  if (charCount > 60) return '1.1rem';
  return '1.25rem';
}

/**
 * Pure rendering component: renders the share card exactly as it will look when
 * exported to an image. Accepts a ref so the parent can pass it to useShareCard.
 */
export const ShareCardPreview = forwardRef<HTMLDivElement, ShareCardPreviewProps>(
  ({ theme, content }, ref) => {
    const cfg = SHARE_CARD_THEMES[theme];
    const fontSize = getQuoteFontSize(content.text.length);

    return (
      <div
        ref={ref}
        style={{
          backgroundColor: cfg.backgroundColor,
          color: cfg.textColor,
          borderRadius: '16px',
          padding: '32px 28px',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '280px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        }}
      >
        {/* Accent left border */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '20px',
            bottom: '20px',
            width: '3px',
            backgroundColor: cfg.accentColor,
            borderRadius: '0 2px 2px 0',
          }}
        />

        {/* Subtle gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.04) 100%)',
            borderRadius: '16px',
            pointerEvents: 'none',
          }}
        />

        {/* Quote body */}
        <div style={{ position: 'relative', flex: 1 }}>
          {/* Opening quotation mark */}
          <div
            style={{
              fontSize: '5rem',
              lineHeight: 1,
              color: cfg.accentColor,
              opacity: 0.6,
              fontFamily: 'Georgia, serif',
              marginBottom: '-12px',
              marginLeft: '-4px',
              userSelect: 'none',
            }}
          >
            &ldquo;
          </div>

          {/* Quote text */}
          <p
            style={{
              fontSize,
              lineHeight: 1.7,
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif',
              color: cfg.textColor,
              margin: '0 0 24px',
              wordBreak: 'break-word',
            }}
          >
            {content.text}
          </p>
        </div>

        {/* Divider + meta */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              height: '1px',
              backgroundColor: cfg.accentColor,
              opacity: 0.4,
              marginBottom: '16px',
            }}
          />

          {/* Author */}
          {content.author && (
            <p
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: cfg.textColor,
                margin: '0 0 4px',
              }}
            >
              &mdash; {content.author}
            </p>
          )}

          {/* Book title */}
          {content.bookTitle && (
            <p
              style={{
                fontSize: '0.75rem',
                color: cfg.secondaryColor,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {content.bookTitle}
            </p>
          )}

          {/* Watermark */}
          <p
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              fontSize: '0.7rem',
              fontWeight: 600,
              color: cfg.accentColor,
              opacity: 0.7,
              margin: 0,
              letterSpacing: '0.05em',
            }}
          >
            Readmigo
          </p>
        </div>
      </div>
    );
  },
);

ShareCardPreview.displayName = 'ShareCardPreview';
