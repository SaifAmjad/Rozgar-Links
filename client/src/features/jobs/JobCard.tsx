import { BriefcaseBusiness, Building2, ExternalLink, MapPin } from 'lucide-react';

import { jobTaxonomy, type JobListing } from '@rozgar-links/shared';

import { Badge } from '../../components/ui/Badge';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { Card } from '../../components/ui/Card';
import { getButtonClasses } from '../../components/ui/buttonStyles';

const fieldLabels = new Map(jobTaxonomy.fields.map((field) => [field.id, field.label]));

interface JobCardProps {
  job: JobListing;
}

export function JobCard({ job }: JobCardProps) {
  const applicationUrl = `/apply?country=${encodeURIComponent(job.country)}&field=${encodeURIComponent(job.field)}&job=${encodeURIComponent(job.id)}`;

  return (
    <Card className="flex h-full flex-col" role="article" aria-labelledby={`${job.id}-title`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Badge tone="green">Job listing</Badge>
        <span className="text-xs font-semibold text-muted">
          {job.isSample ? 'Rozgar Links' : job.source}
        </span>
      </div>
      <h2 className="mt-5 text-xl" id={`${job.id}-title`}>
        {job.title}
      </h2>
      <dl className="mt-4 space-y-3 text-sm text-muted">
        <div className="flex gap-2">
          <Building2 aria-hidden="true" className="mt-0.5 shrink-0 text-brand-green" size={17} />
          <div>
            <dt className="sr-only">Company</dt>
            <dd>{job.company}</dd>
          </div>
        </div>
        <div className="flex gap-2">
          <MapPin aria-hidden="true" className="mt-0.5 shrink-0 text-brand-blue" size={17} />
          <div>
            <dt className="sr-only">Location</dt>
            <dd>
              {job.city}, {job.country}
            </dd>
          </div>
        </div>
        <div className="flex gap-2">
          <BriefcaseBusiness
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-primary"
            size={17}
          />
          <div>
            <dt className="sr-only">Job field</dt>
            <dd>{fieldLabels.get(job.field) ?? job.field}</dd>
          </div>
        </div>
      </dl>
      <div className="mt-auto pt-6">
        <p className="mb-3 text-sm leading-6 text-muted">
          {job.isSample
            ? 'Continue with the country and work category already selected for you.'
            : 'Review the guided application steps or visit the original source.'}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink className="w-full sm:w-auto" to={applicationUrl}>
            View application steps
          </ButtonLink>
          {!job.isSample && job.sourceUrl ? (
            <a
              className={getButtonClasses('outline')}
              href={job.sourceUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Original source <ExternalLink aria-hidden="true" size={16} />
            </a>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
