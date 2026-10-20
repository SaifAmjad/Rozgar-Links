import { PageIntro } from '../components/PageIntro';
import { PageContainer } from '../components/layout/PageContainer';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

interface LegalSection {
  body: string;
  heading: string;
}

interface LegalStubProps {
  description: string;
  sections: LegalSection[];
  title: string;
}

function LegalStub({ description, sections, title }: LegalStubProps) {
  return (
    <>
      <PageIntro description={description} eyebrow="Draft policy" title={title} />
      <PageContainer className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Badge tone="warning">Owner and legal approval required</Badge>
          <div className="mt-6 space-y-5">
            {sections.map((section) => (
              <Card key={section.heading}>
                <h2 className="text-xl">{section.heading}</h2>
                <p className="mt-3 leading-7 text-muted">{section.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    </>
  );
}

const privacySections = [
  {
    heading: 'Information handling',
    body: 'The planned service will collect application details and documents only with explicit consent. Applicant PII will not be stored in the application database in v1.',
  },
  {
    heading: 'Retention and deletion',
    body: 'A specific retention period, deletion procedure and subject-access channel must be approved before launch. Temporary files must be removed after processing, including error paths.',
  },
  {
    heading: 'Third-party transfer',
    body: 'Applicants must be told that an approved SMTP provider will process their submitted information and attachments for administrator delivery.',
  },
];

const termsSections = [
  {
    heading: 'Independent service',
    body: 'Rozgar Links is not affiliated with or endorsed by job boards or employers unless written authorization is published. External trademarks remain their owners’ property.',
  },
  {
    heading: 'No employment guarantee',
    body: 'Using the service will not guarantee an interview, visa, offer or placement. Applicant information must be accurate and will remain subject to manual review.',
  },
  {
    heading: 'Launch authority',
    body: 'Public recruitment assistance and paid services remain blocked until the legal entity, licence number and regulatory authority are independently verified.',
  },
];

const feeSections = [
  {
    heading: 'Collection is disabled',
    body: 'Any bank details or fee values shown in this demonstration are test data and must not be used until legal, licensing, identity and payment approvals are complete.',
  },
  {
    heading: 'Proof is not verification',
    body: 'A payment screenshot or transaction reference is unverified evidence only. It must never be described as a confirmed payment without manual offline review.',
  },
  {
    heading: 'Refund terms pending',
    body: 'Eligibility, timelines, deductions, cancellation rights and the support process require owner and legal approval before applicants can accept this policy.',
  },
];

export function PrivacyPage() {
  return (
    <LegalStub
      description="This privacy notice is a reviewable development stub, not an approved public policy."
      sections={privacySections}
      title="Privacy notice"
    />
  );
}

export function TermsPage() {
  return (
    <LegalStub
      description="These terms are a reviewable development stub and cannot be accepted as final service terms."
      sections={termsSections}
      title="Terms of service"
    />
  );
}

export function FeesRefundsPage() {
  return (
    <LegalStub
      description="This fee and refund policy is a non-operational draft. Rozgar Links is not collecting payments."
      sections={feeSections}
      title="Fees and refunds"
    />
  );
}
