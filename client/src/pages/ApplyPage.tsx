import { PageContainer } from '../components/layout/PageContainer';
import { ApplicationWizard } from '../features/application/ApplicationWizard';

export function ApplyPage() {
  return (
    <>
      <section className="border-b bg-surface py-8 sm:py-10">
        <PageContainer>
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-green">
              Five simple steps
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl">Application form</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
              Complete one step at a time. You can review everything before submitting.
            </p>
          </div>
        </PageContainer>
      </section>

      <PageContainer className="py-6 sm:py-10">
        <ApplicationWizard />
      </PageContainer>
    </>
  );
}
