import { AlertTriangle, Info } from 'lucide-react';

import { cn } from '../../lib/cn';

interface ProvenanceLabelProps {
  className?: string;
  isStale?: boolean;
}

export function ProvenanceLabel({ className, isStale = false }: ProvenanceLabelProps) {
  const Icon = isStale ? AlertTriangle : Info;

  return (
    <p className={cn('text-sm font-semibold', isStale ? 'text-warning' : 'text-muted', className)}>
      <Icon aria-hidden="true" className="mr-1.5 inline" size={16} />
      {isStale
        ? 'Indicative figures — last valid update shown'
        : 'Indicative figures, updated daily'}
    </p>
  );
}
