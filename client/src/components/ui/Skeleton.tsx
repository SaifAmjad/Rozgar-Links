import { cn } from '../../lib/cn';

interface SkeletonProps {
  className?: string;
  label?: string;
}

export function Skeleton({ className, label = 'Loading content' }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-border', className)} role="status">
      <span className="sr-only">{label}</span>
    </div>
  );
}
