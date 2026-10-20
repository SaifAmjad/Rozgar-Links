import { PageIntro } from '../components/PageIntro';
import { PageContainer } from '../components/layout/PageContainer';
import { JobsDirectory } from '../features/jobs/JobsDirectory';

export function JobsPage() {
  return (
    <>
      <PageIntro
        description="Explore job opportunities across six Gulf countries and filter them by country, work field or keyword."
        eyebrow="Opportunity directory"
        title="Jobs across the Gulf"
      />
      <PageContainer className="py-12 sm:py-16">
        <div className="mb-8 rounded-xl border border-warning/30 bg-warning/5 p-5 text-sm leading-6 text-muted">
          <p className="font-bold text-primary">Confirm details before applying</p>
          <p className="mt-2">
            Job availability and requirements can change. Rozgar Links is independent and does not
            claim affiliation with or endorsement by external job boards or employers.
          </p>
        </div>
        <JobsDirectory />
      </PageContainer>
    </>
  );
}
