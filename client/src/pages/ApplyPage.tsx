import { PageIntro } from '../components/PageIntro';
import { PageContainer } from '../components/layout/PageContainer';
import { ButtonLink } from '../components/ui/ButtonLink';
import { ApplicationWizard } from '../features/application/ApplicationWizard';

export function ApplyPage() {
  return (
    <>
      <PageIntro
        actions={
          <ButtonLink to="/fees-and-refunds" variant="outline">
            Review fee policy
          </ButtonLink>
        }
        description="Explore the five-step workflow, validate every required field and review a sanitized summary. Hosted demo submissions are disabled, so use test details and documents only."
        eyebrow="Application service"
        title="Application form"
      />
      <PageContainer className="py-10 sm:py-14">
        <ApplicationWizard />
      </PageContainer>
    </>
  );
}
