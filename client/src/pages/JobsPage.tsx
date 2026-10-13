import { BriefcaseBusiness, Filter, Search } from 'lucide-react';

import { PageIntro } from '../components/PageIntro';
import { PageContainer } from '../components/layout/PageContainer';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { TextInput } from '../components/ui/TextInput';

export function JobsPage() {
  return (
    <>
      <PageIntro
        description="Searchable sample listings will be added in Milestone 5. No vacancy shown on this page is currently represented as live or verified."
        eyebrow="Opportunity directory"
        title="Jobs across the Gulf"
      />
      <PageContainer className="py-12 sm:py-16">
        <Card className="bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Search aria-hidden="true" className="text-brand-green" size={22} />
              <h2 className="text-xl">Search and filters</h2>
            </div>
            <Badge tone="warning">Coming in M5</Badge>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <TextInput
              description="Search is disabled until sample records are available."
              disabled
              label="Search jobs"
              placeholder="Job title or company"
              type="search"
            />
            <label className="space-y-2 text-sm font-bold text-primary">
              <span className="block">Country</span>
              <select
                className="min-h-11 w-full rounded-xl border bg-surface px-4 text-muted"
                disabled
              >
                <option>All Gulf countries</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-bold text-primary">
              <span className="block">Field</span>
              <select
                className="min-h-11 w-full rounded-xl border bg-surface px-4 text-muted"
                disabled
              >
                <option>All fields</option>
              </select>
            </label>
          </div>
        </Card>

        <div className="mt-8 rounded-xl border border-dashed bg-bg px-6 py-14 text-center">
          <BriefcaseBusiness aria-hidden="true" className="mx-auto text-accent-blue" size={38} />
          <h2 className="mt-5 text-2xl">No listings published yet</h2>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-muted">
            Milestone 5 will add fictional records labelled “Sample listing.” Genuine external links
            will appear only when the source and authorization are verified.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">
            <Filter aria-hidden="true" size={18} /> Filters will support country, field and
            keywords.
          </p>
        </div>
      </PageContainer>
    </>
  );
}
