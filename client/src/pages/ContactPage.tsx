import { ArrowRight } from 'lucide-react';

import { PageIntro } from '../components/PageIntro';
import { PageContainer } from '../components/layout/PageContainer';
import { WhatsAppIcon } from '../components/ui/WhatsAppIcon';
import { getButtonClasses } from '../components/ui/buttonStyles';
import { useLanguage } from '../i18n/useLanguage';
import { whatsAppChatUrl } from '../lib/contact';

export function ContactPage() {
  const { t } = useLanguage();

  return (
    <>
      <PageIntro
        description={t(
          'Have a question? Contact us on WhatsApp for help with applications, CV preparation or general enquiries.',
        )}
        eyebrow={t('Get in touch')}
        title={t('Contact Rozgar Links')}
      />
      <PageContainer className="py-8 sm:py-12">
        <section
          className="mx-auto max-w-2xl rounded-2xl border border-brand-green/20 bg-surface p-6 sm:p-8"
          aria-labelledby="contact-whatsapp-title"
        >
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-green/10 text-brand-green">
              <WhatsAppIcon className="size-7" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl rtl:leading-loose" id="contact-whatsapp-title">
                {t('Reach us on WhatsApp')}
              </h2>
              <p className="mt-2 text-2xl font-bold tracking-wide text-primary">
                <bdi dir="ltr">0339 7779779</bdi>
              </p>
            </div>
          </div>
          <a
            aria-label={t('Chat with Rozgar Links on WhatsApp (opens in a new tab)')}
            className={getButtonClasses(
              'secondary',
              'mt-6 min-h-12 w-full motion-reduce:transition-none',
            )}
            href={whatsAppChatUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon className="size-5" />
            {t('Chat on WhatsApp')}
            <ArrowRight aria-hidden="true" className="rtl:rotate-180" size={18} />
          </a>
        </section>
      </PageContainer>
    </>
  );
}
