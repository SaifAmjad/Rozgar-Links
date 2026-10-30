import { applicationSubmissionResponseSchema } from '@rozgar-links/shared';
import { CheckCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { PageContainer } from '../components/layout/PageContainer';
import { ButtonLink } from '../components/ui/ButtonLink';
import { Card } from '../components/ui/Card';
import { useLanguage } from '../i18n/useLanguage';

export function SuccessPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const submission = applicationSubmissionResponseSchema.safeParse(location.state);

  if (!submission.success) {
    return (
      <PageContainer className="py-14 sm:py-20">
        <Card className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl">{t('Submission receipt unavailable')}</h1>
          <p className="mt-4 leading-7 text-muted">
            {t(
              'A receipt appears here only after the server confirms that the administrator email was accepted. No application reference was created on this page.',
            )}
          </p>
          <ButtonLink className="mt-6" to="/apply">
            {t('Return to application')}
          </ButtonLink>
        </Card>
      </PageContainer>
    );
  }

  const { referenceId } = submission.data;

  return (
    <PageContainer className="py-14 sm:py-20">
      <Card className="mx-auto max-w-2xl">
        <CheckCircle2 aria-hidden="true" className="text-brand-green" size={42} />
        <p className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-brand-green">
          {t('Administrator delivery accepted')}
        </p>
        <h1 className="mt-2 text-3xl">{t('Application submitted')}</h1>
        <p className="mt-4 leading-7 text-muted">
          {t(
            'Keep this server-issued reference for follow-up. Submission does not verify payment or guarantee an interview, visa, offer or placement.',
          )}
        </p>

        <div className="mt-6 rounded-xl bg-surface p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-muted">
            {t('Reference ID')}
          </p>
          <p className="mt-1 break-all text-2xl font-black text-primary" dir="ltr">
            {referenceId}
          </p>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <ButtonLink to="/jobs">{t('Browse jobs')}</ButtonLink>
          <ButtonLink to="/contact" variant="outline">
            {t('Contact information')}
          </ButtonLink>
        </div>
      </Card>
    </PageContainer>
  );
}
