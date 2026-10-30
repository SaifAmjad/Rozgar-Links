import { Clock3, MailWarning, MapPin } from 'lucide-react';

import { PageIntro } from '../components/PageIntro';
import { PageContainer } from '../components/layout/PageContainer';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { useLanguage } from '../i18n/useLanguage';

export function ContactPage() {
  const { t } = useLanguage();

  return (
    <>
      <PageIntro
        description={t(
          'Verified business contact details will be published only after the owner confirms the legal entity, service address and support channel.',
        )}
        eyebrow={t('Get in touch')}
        title={t('Contact Rozgar Links')}
      />
      <PageContainer className="py-12 sm:py-16">
        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <MailWarning aria-hidden="true" className="text-warning" size={26} />
            <h2 className="mt-4 text-xl">{t('Email')}</h2>
            <Badge tone="warning">{t('Pending verification')}</Badge>
            <p className="mt-4 leading-7 text-muted">
              {t(
                'No public support email is approved. Do not send personal or identity information.',
              )}
            </p>
          </Card>
          <Card>
            <MapPin aria-hidden="true" className="text-brand-blue" size={26} />
            <h2 className="mt-4 text-xl">{t('Business address')}</h2>
            <Badge tone="warning">{t('Pending verification')}</Badge>
            <p className="mt-4 leading-7 text-muted">
              {t('A legitimate service address will appear after owner and legal review.')}
            </p>
          </Card>
          <Card>
            <Clock3 aria-hidden="true" className="text-brand-green" size={26} />
            <h2 className="mt-4 text-xl">{t('Support hours')}</h2>
            <Badge tone="warning">{t('Pending verification')}</Badge>
            <p className="mt-4 leading-7 text-muted">
              {t('Support availability has not been approved or published.')}
            </p>
          </Card>
        </div>
        <div className="mt-8 rounded-xl border border-warning/30 bg-warning/10 p-5">
          <h2 className="text-lg">{t('Applicant safety notice')}</h2>
          <p className="mt-2 leading-7 text-muted">
            {t(
              'Rozgar Links is not accepting applications, fees, resumes, passport copies, CNIC values or payment evidence through contact channels during this demonstration stage.',
            )}
          </p>
        </div>
      </PageContainer>
    </>
  );
}
