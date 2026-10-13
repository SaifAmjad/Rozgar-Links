import { applicationSubmissionResponseSchema } from '@rozgar-links/shared';
import { CheckCircle2, MailCheck, MailX } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { PageContainer } from '../components/layout/PageContainer';
import { ButtonLink } from '../components/ui/ButtonLink';
import { Card } from '../components/ui/Card';

export function SuccessPage() {
  const location = useLocation();
  const submission = applicationSubmissionResponseSchema.safeParse(location.state);

  if (!submission.success) {
    return (
      <PageContainer className="py-14 sm:py-20">
        <Card className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl">Submission receipt unavailable</h1>
          <p className="mt-4 leading-7 text-muted">
            A receipt appears here only after the server confirms that the administrator email was
            accepted. No application reference was created on this page.
          </p>
          <ButtonLink className="mt-6" to="/apply">
            Return to application
          </ButtonLink>
        </Card>
      </PageContainer>
    );
  }

  const { confirmationEmailSent, referenceId } = submission.data;

  return (
    <PageContainer className="py-14 sm:py-20">
      <Card className="mx-auto max-w-2xl">
        <CheckCircle2 aria-hidden="true" className="text-brand-green" size={42} />
        <p className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-brand-green">
          Administrator delivery accepted
        </p>
        <h1 className="mt-2 text-3xl">Application submitted</h1>
        <p className="mt-4 leading-7 text-muted">
          Keep this server-issued reference for follow-up. Submission does not verify payment or
          guarantee an interview, visa, offer or placement.
        </p>

        <div className="mt-6 rounded-xl bg-surface p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-muted">Reference ID</p>
          <p className="mt-1 break-all text-2xl font-black text-primary">{referenceId}</p>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-xl border p-4" role="status">
          {confirmationEmailSent ? (
            <MailCheck aria-hidden="true" className="mt-0.5 shrink-0 text-brand-green" size={22} />
          ) : (
            <MailX aria-hidden="true" className="mt-0.5 shrink-0 text-warning" size={22} />
          )}
          <p className="text-sm leading-6 text-muted">
            {confirmationEmailSent
              ? 'Your confirmation email was accepted by the configured SMTP server.'
              : 'No applicant confirmation email was sent. Use the reference above for follow-up.'}
          </p>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <ButtonLink to="/jobs">Browse sample jobs</ButtonLink>
          <ButtonLink to="/contact" variant="outline">
            Contact information
          </ButtonLink>
        </div>
      </Card>
    </PageContainer>
  );
}
