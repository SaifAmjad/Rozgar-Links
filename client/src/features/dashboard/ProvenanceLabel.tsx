import { AlertTriangle, Info } from 'lucide-react';

interface ProvenanceLabelProps {
  isStale?: boolean;
}

export function ProvenanceLabel({ isStale = false }: ProvenanceLabelProps) {
  const Icon = isStale ? AlertTriangle : Info;

  return (
    <p
      className={
        isStale ? 'text-sm font-semibold text-warning' : 'text-sm font-semibold text-muted'
      }
    >
      <Icon aria-hidden="true" className="mr-1.5 inline" size={16} />
      {isStale
        ? 'Indicative figures — last valid update shown'
        : 'Indicative figures, updated daily'}
    </p>
  );
}
