import { Clock3, MailWarning, MapPin } from 'lucide-react';

import { PageIntro } from '../components/PageIntro';
import { PageContainer } from '../components/layout/PageContainer';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

export function ContactPage() {
  return (
    <>
      <PageIntro
        description="Verified business contact details will be published only after the owner confirms the legal entity, service address and support channel."
        eyebrow="Get in touch"
        title="Contact Rozgar Links"
      />
      <PageContainer className="py-12 sm:py-16">
        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <MailWarning aria-hidden="true" className="text-warning" size={26} />
            <h2 className="mt-4 text-xl">Email</h2>
            <Badge tone="warning">Pending verification</Badge>
            <p className="mt-4 leading-7 text-muted">
              No public support email is approved. Do not send personal or identity information.
            </p>
          </Card>
          <Card>
            <MapPin aria-hidden="true" className="text-brand-blue" size={26} />
            <h2 className="mt-4 text-xl">Business address</h2>
            <Badge tone="warning">Pending verification</Badge>
            <p className="mt-4 leading-7 text-muted">
              A legitimate service address will appear after owner and legal review.
            </p>
          </Card>
          <Card>
            <Clock3 aria-hidden="true" className="text-brand-green" size={26} />
            <h2 className="mt-4 text-xl">Support hours</h2>
            <Badge tone="warning">Pending verification</Badge>
            <p className="mt-4 leading-7 text-muted">
              Support availability has not been approved or published.
            </p>
          </Card>
        </div>
        <div className="mt-8 rounded-xl border border-warning/30 bg-warning/10 p-5">
          <h2 className="text-lg">Applicant safety notice</h2>
          <p className="mt-2 leading-7 text-muted">
            Rozgar Links is not accepting applications, fees, resumes, passport copies, CNIC values
            or payment evidence through contact channels in this milestone.
          </p>
        </div>
      </PageContainer>
    </>
  );
}
