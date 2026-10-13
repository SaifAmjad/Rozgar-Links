import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../../lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div className={cn('rounded-xl border bg-bg p-5 shadow-soft sm:p-6', className)} {...props}>
      {children}
    </div>
  );
}
