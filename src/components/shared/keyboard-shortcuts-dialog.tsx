'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  KeyboardShortcut,
  formatShortcut,
  groupShortcuts,
} from '@/lib/hooks/use-keyboard-shortcuts';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
  shortcuts,
}: KeyboardShortcutsDialogProps) {
  const groupedShortcuts = groupShortcuts(shortcuts);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            键盘快捷键
            <Badge variant="secondary">按 ? 显示/隐藏</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {Object.entries(groupedShortcuts).map(([category, items], index) => (
            <div key={category}>
              {index > 0 && <Separator className="mb-4" />}
              <h3 className="mb-3 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                {category}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {items.map((shortcut) => (
                  <div
                    key={`${shortcut.key}-${shortcut.ctrl}-${shortcut.shift}`}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <kbd className="ml-2 rounded bg-muted px-2 py-1 font-mono text-xs">
                      {formatShortcut(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
