import { ArrowRight, Banknote, BriefcaseBusiness, Info, Layers3, MapPin } from 'lucide-react';

import type { OccupationListing } from '@rozgar-links/shared';

import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { useLanguage } from '../../i18n/useLanguage';

const countryNames: Record<string, string> = {
  'saudi-arabia': 'Saudi Arabia',
  'united-arab-emirates': 'United Arab Emirates',
  qatar: 'Qatar',
  kuwait: 'Kuwait',
  oman: 'Oman',
  bahrain: 'Bahrain',
};
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
      className="flex h-full min-w-0 flex-col rounded-2xl border-border bg-bg shadow-none motion-safe:transition-[border-color,box-shadow] motion-safe:duration-200 hover:border-accent-blue/40 hover:shadow-soft focus-within:border-accent-blue/60"
      role="article"
      aria-labelledby={`${job.id}-title`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone="green">{t('Occupation directory')}</Badge>
        <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium tabular-nums text-muted">
          #{job.sortOrder}
        </span>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary/5 text-primary">
          <BriefcaseBusiness aria-hidden="true" size={18} />
        </span>
        <h2
          className="min-w-0 break-words text-xl font-bold leading-snug tracking-tight text-primary rtl:leading-relaxed rtl:tracking-normal"
          id={`${job.id}-title`}
        >
          {title}
        </h2>
      </div>

      <dl className="mt-5 flex flex-1 flex-col gap-4 text-sm">
        <div className="flex items-start gap-2.5">
          <MapPin aria-hidden="true" className="mt-0.5 shrink-0 text-brand-green" size={16} />
          <div className="min-w-0">
            <dt className="text-xs font-medium leading-5 text-muted">{t('Sample countries')}</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {job.countryIds.map((id) => (
                <span
                  className="max-w-full rounded-full bg-primary/5 px-2.5 py-1 text-xs font-medium leading-5 text-primary"
                  key={id}
                >
                  {t(countryNames[id] ?? id)}
                </span>
              ))}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Layers3 aria-hidden="true" className="mt-0.5 shrink-0 text-brand-green" size={16} />
          <div className="min-w-0">
            <dt className="text-xs font-medium leading-5 text-muted">{t('Category')}</dt>
            <dd className="mt-0.5 font-medium leading-6 text-text">{category}</dd>
          </div>
        </div>
        <div className="mt-auto flex items-start gap-2.5 rounded-xl border border-brand-green/10 bg-brand-green/5 p-3.5">
          <Banknote aria-hidden="true" className="mt-0.5 shrink-0 text-brand-green" size={18} />
          <div className="min-w-0">
            <dt className="text-xs font-medium leading-5 text-muted">
              {t('Indicative monthly salary')}
            </dt>
            <dd className="mt-1 text-lg font-bold leading-7 tabular-nums text-primary">
              <bdi dir="ltr">
                SAR {maximum} / {t('month')}
              </bdi>
            </dd>
          </div>
        </div>
      </dl>

      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted">
        <Info aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
        <span>{t('Directory estimate only — not a vacancy or guaranteed employer offer.')}</span>
      </p>
      <ButtonLink
        className="mt-4 min-h-12 w-full focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 motion-reduce:transition-none"
        to={`/apply?job=${encodeURIComponent(job.id)}`}
        variant="secondary"
      >
        {t('Apply now')}
        <span className="sr-only">: {title}</span>
        <ArrowRight aria-hidden="true" className="rtl:rotate-180" size={18} />
      </ButtonLink>
    </Card>
  );
}
