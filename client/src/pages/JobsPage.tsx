import { PageIntro } from '../components/PageIntro';
import { PageContainer } from '../components/layout/PageContainer';
import { JobsDirectory } from '../features/jobs/JobsDirectory';

export function JobsPage() {
  return (
    <>
      <PageIntro
        description="Explore fictional examples across six Gulf countries. Every sample is clearly labelled and does not represent a live or verified vacancy."
        eyebrow="Opportunity directory"
        title="Jobs across the Gulf"
      />
      <PageContainer className="py-12 sm:py-16">
        <div className="mb-8 rounded-xl border border-warning/30 bg-warning/5 p-5 text-sm leading-6 text-muted">
          <p className="font-bold text-primary">Sample directory — not live vacancies</p>
          <p className="mt-2">
            All current records are fictional interface examples with no original-source links.
            Rozgar Links is independent and is not affiliated with or endorsed by GulfTalent or
            NaukriGulf.
          </p>
        </div>
        <JobsDirectory />
      </PageContainer>
    </>
  );
}
