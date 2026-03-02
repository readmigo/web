'use client';

import { useState, useEffect, useMemo } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DanmakuItem {
  id: string;
  content: string;
}

interface DanmakuOverlayProps {
  items: DanmakuItem[];
  onSend: (content: string) => void;
  isSending?: boolean;
}

const LANE_COUNT = 5;
const LANE_HEIGHT = 36; // px

export function DanmakuOverlay({ items, onSend, isSending }: DanmakuOverlayProps) {
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Reset animation when items change
  useEffect(() => {
    setAnimationKey((k) => k + 1);
  }, [items.length]);

  // Assign lanes and delays to items
  const bullets = useMemo(() => {
    return items.map((item, index) => ({
      ...item,
      lane: index % LANE_COUNT,
      delay: index * 400 + Math.random() * 200, // staggered delay
      duration: 8000 + item.content.length * 60, // longer text = slower
    }));
  }, [items]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSend(inputValue.trim());
    setInputValue('');
    setShowInput(false);
  };

  return (
    <>
      {/* Danmaku bullets layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" key={animationKey}>
        {bullets.map((bullet) => (
          <div
            key={bullet.id}
            className="absolute whitespace-nowrap rounded-full bg-black/40 px-3 py-1 text-sm font-medium text-white"
            style={{
              top: `${bullet.lane * LANE_HEIGHT + 20}px`,
              animation: `danmaku-slide ${bullet.duration}ms linear ${bullet.delay}ms both`,
            }}
          >
            {bullet.content}
          </div>
        ))}
      </div>

      {/* Input area */}
      {showInput ? (
        <div className="absolute bottom-4 left-4 right-4">
          <p className="mb-1 text-center text-xs text-white/60">
            Comments are public and visible to everyone
          </p>
          <div className="flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Send a public comment visible to all listeners..."
              maxLength={100}
              className="flex-1 rounded-full border-white/20 bg-black/40 text-white placeholder:text-white/40"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              autoFocus
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
              className="h-10 w-10 rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/20 px-4 py-2 text-sm text-white/60 transition-colors hover:bg-black/30"
        >
          <Send className="h-4 w-4" />
          <span>Say something...</span>
        </button>
      )}

      {/* CSS animation */}
      <style jsx global>{`
        @keyframes danmaku-slide {
          from {
            transform: translateX(100vw);
          }
          to {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </>
  );
}
