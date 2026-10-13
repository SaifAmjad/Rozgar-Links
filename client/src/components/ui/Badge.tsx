import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';

interface BadgeProps {
  children: ReactNode;
  tone?: 'blue' | 'green' | 'inverse' | 'warning';
}

const toneClasses = {
  blue: 'bg-accent-blue/15 text-primary',
  green: 'bg-light-green/15 text-primary',
  inverse: 'bg-bg text-primary',
  warning: 'bg-warning/10 text-primary ring-1 ring-warning/30',
};

export function Badge({ children, tone = 'blue' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide',
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
