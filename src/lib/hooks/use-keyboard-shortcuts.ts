'use client';

import { useEffect, useCallback, useState } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  category: string;
  action: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: KeyboardShortcut[];
}

export function useKeyboardShortcuts({
  enabled = true,
  shortcuts,
}: UseKeyboardShortcutsOptions) {
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Show help with ?
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      // Find matching shortcut
      const shortcut = shortcuts.find((s) => {
        const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatch = s.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = s.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = s.alt ? event.altKey : !event.altKey;

        // For mac, treat Cmd as Ctrl
        const metaMatch = s.meta ? event.metaKey : true;

        return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch;
      });

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    },
    [enabled, shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    showHelp,
    setShowHelp,
    shortcuts,
  };
}

// Format shortcut key for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.shift) {
    parts.push('⇧');
  }

  // Format special keys
  const keyMap: Record<string, string> = {
    ' ': 'Space',
    arrowleft: '←',
    arrowright: '→',
    arrowup: '↑',
    arrowdown: '↓',
    escape: 'Esc',
    enter: '↵',
  };

  const displayKey = keyMap[shortcut.key.toLowerCase()] || shortcut.key.toUpperCase();
  parts.push(displayKey);

  return parts.join(' + ');
}

// Group shortcuts by category
export function groupShortcuts(
  shortcuts: KeyboardShortcut[]
): Record<string, KeyboardShortcut[]> {
  return shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);
}
