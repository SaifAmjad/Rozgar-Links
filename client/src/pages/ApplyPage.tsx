import { CheckCircle2, FileText, LockKeyhole } from 'lucide-react';

import { PageIntro } from '../components/PageIntro';
import { PageContainer } from '../components/layout/PageContainer';
import { Badge } from '../components/ui/Badge';
import { ButtonLink } from '../components/ui/ButtonLink';
import { Card } from '../components/ui/Card';

const applicationSteps = [
  ['Personal details', 'Identity and contact fields with server-side validation.'],
  ['Job preferences', 'Countries, field, roles, experience and relocation choices.'],
  ['Documents', 'CV plus optional passport copy and photo with secure validation.'],
  ['Payment evidence', 'Demo-only payment proof and required policy consents.'],
  ['Review and submit', 'A final sanitized summary before a single submission.'],
];

export function ApplyPage() {
  return (
    <>
      <PageIntro
        actions={
          <ButtonLink to="/fees-and-refunds" variant="outline">
            Review fee policy
          </ButtonLink>
        }
        description="The secure five-step form is scheduled for Milestone 6. Application submission, document upload and payment collection are currently disabled."
        eyebrow="Application service"
        title="Prepare before you apply"
      />
      <PageContainer className="py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section aria-labelledby="application-steps-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl" id="application-steps-title">
                Planned application steps
              </h2>
              <Badge tone="warning">Form coming in M6</Badge>
            </div>
            <ol className="mt-6 space-y-4">
              {applicationSteps.map(([title, description], index) => (
                <li className="flex gap-4 rounded-xl border bg-bg p-5 shadow-soft" key={title}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg">{title}</h3>
                    <p className="mt-1 leading-6 text-muted">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <aside className="space-y-5" aria-label="Application safety information">
            <Card className="bg-surface">
              <LockKeyhole aria-hidden="true" className="text-brand-green" size={26} />
              <h2 className="mt-4 text-xl">Do not send documents yet</h2>
              <p className="mt-3 leading-7 text-muted">
                No upload or email channel is active in M2. Rozgar Links does not currently accept
                resumes, identity documents or payment screenshots.
              </p>
            </Card>
            <Card>
              <FileText aria-hidden="true" className="text-brand-blue" size={26} />
              <h2 className="mt-4 text-xl">Approval gates remain</h2>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-muted">
                {[
                  'Recruitment licence verification',
                  'Privacy and retention approval',
                  'Fee and refund legal review',
                ].map((item) => (
                  <li className="flex gap-2" key={item}>
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-warning"
                      size={16}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
        </div>
      </PageContainer>
    </>
  );
}
