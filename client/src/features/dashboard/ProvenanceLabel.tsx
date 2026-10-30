import { AlertTriangle, Info } from 'lucide-react';

import { cn } from '../../lib/cn';
import { useLanguage } from '../../i18n/useLanguage';

interface ProvenanceLabelProps {
  className?: string;
  isStale?: boolean;
}

export function ProvenanceLabel({ className, isStale = false }: ProvenanceLabelProps) {
  const { t } = useLanguage();
  const Icon = isStale ? AlertTriangle : Info;

  return (
    <p className={cn('text-sm font-semibold', isStale ? 'text-warning' : 'text-muted', className)}>
      <Icon aria-hidden="true" className="me-1.5 inline" size={16} />
      {t(
        isStale
          ? 'Indicative figures — last valid update shown'
          : 'Indicative figures, updated daily',
      )}
    </p>
  );
}
