import { Banknote, BriefcaseBusiness, FolderTree } from 'lucide-react';

import type { OccupationListing } from '@rozgar-links/shared';

import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { useLanguage } from '../../i18n/useLanguage';

interface JobCardProps {
  job: OccupationListing;
}

export function JobCard({ job }: JobCardProps) {
  const { language, t } = useLanguage();
  const title = language === 'ur' ? job.titleUr : job.titleEn;
  const category = language === 'ur' ? job.category.nameUr : job.category.nameEn;
  const numberFormatter = new Intl.NumberFormat(language === 'ur' ? 'ur-PK' : 'en-US');
  const maximum = job.salaryMaxOpenEnded
    ? `${numberFormatter.format(job.salaryMin)}+`
    : `${numberFormatter.format(job.salaryMin)} – ${numberFormatter.format(job.salaryMax ?? 0)}`;

  return (
    <Card
      className="flex h-full flex-col border-border bg-bg transition-shadow hover:shadow-soft"
      role="article"
      aria-labelledby={`${job.id}-title`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Badge tone="green">{t('Occupation directory')}</Badge>
        <span className="text-xs font-bold text-muted">#{job.sortOrder}</span>
      </div>

      <div className="mt-5 flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
          <BriefcaseBusiness aria-hidden="true" size={22} />
        </span>
        <h2 className="min-w-0 text-xl leading-snug" id={`${job.id}-title`}>
          {title}
        </h2>
      </div>

      <dl className="mt-5 space-y-4 text-sm">
        <div className="flex items-start gap-3">
          <FolderTree aria-hidden="true" className="mt-0.5 shrink-0 text-brand-green" size={18} />
          <div>
            <dt className="font-semibold text-muted">{t('Category')}</dt>
            <dd className="mt-1 font-medium text-text">{category}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-surface p-4">
          <Banknote aria-hidden="true" className="mt-0.5 shrink-0 text-brand-blue" size={19} />
          <div>
            <dt className="font-semibold text-muted">{t('Indicative monthly salary')}</dt>
            <dd className="mt-1 text-lg font-bold text-primary">
              <bdi dir="ltr">
                SAR {maximum} / {t('month')}
              </bdi>
            </dd>
          </div>
        </div>
      </dl>

      <p className="mt-auto pt-5 text-xs leading-5 text-muted">
        {t('Directory estimate only — not a vacancy or guaranteed employer offer.')}
      </p>
    </Card>
  );
}
