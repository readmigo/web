import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional icon or illustration displayed above the title */
  icon?: React.ReactNode;
  /** Primary message describing the empty state */
  title: string;
  /** Optional secondary message with additional context */
  subtitle?: string;
  /** Optional action element (e.g. a Button or Link) */
  action?: React.ReactNode;
}

/**
 * A centered empty-state placeholder used when a view has no content to display.
 *
 * Usage:
 *   <EmptyState
 *     icon={<BookOpen className="h-8 w-8" />}
 *     title="No books yet"
 *     subtitle="Start browsing the bookstore to add books."
 *     action={<Button>Browse</Button>}
 *   />
 */
function EmptyState({
  icon,
  title,
  subtitle,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 py-24 text-center',
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}

      <p
        className={cn(
          'text-lg font-medium text-muted-foreground',
          icon && 'mt-4',
        )}
      >
        {title}
      </p>

      {subtitle && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground/80">
          {subtitle}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

EmptyState.displayName = 'EmptyState';

export { EmptyState };
