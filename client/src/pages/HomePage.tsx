import { ArrowRight, Headset, Search } from 'lucide-react';

import { PageContainer } from '../components/layout/PageContainer';
import { WhatsAppIcon } from '../components/ui/WhatsAppIcon';
import { ButtonLink } from '../components/ui/ButtonLink';
import { HeroJobBar } from '../features/dashboard/HeroJobBar';
import { HowItWorksDialog } from '../features/home/HowItWorksDialog';
import { FeaturedJobs } from '../features/jobs/FeaturedJobs';
import { useLanguage } from '../i18n/useLanguage';
import { whatsAppChatUrl } from '../lib/contact';

export function HomePage() {
  const { t } = useLanguage();

  return (
    <>
      <section className="relative overflow-hidden bg-hero-gradient text-white">
        <div
          aria-hidden="true"
          className="absolute -right-36 -top-36 h-96 w-96 rounded-full border border-white/15 bg-white/5"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-48 left-1/3 h-96 w-96 rounded-full bg-brand-green/20"
        />

        <HowItWorksDialog />
        <PageContainer className="relative pb-12 pt-24 sm:pb-16 sm:pt-24 lg:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl leading-[1.08] text-white sm:text-5xl lg:text-6xl">
              {t('Find your next Gulf opportunity.')}
            </h1>
            <p
              className="mt-3 font-urdu text-xl leading-loose text-white/90 sm:text-2xl"
              dir="rtl"
              lang="ur"
            >
              لوگوں کو مواقع سے جوڑنا
            </p>
            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
              {t('Explore jobs by country and apply with clear, simple guidance.')}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink className="w-full sm:w-auto" to="/jobs" variant="outline">
                <Search aria-hidden="true" size={18} /> {t('Find jobs')}
              </ButtonLink>
              <ButtonLink className="w-full sm:w-auto" to="/apply" variant="secondary">
                {t('Start application')}{' '}
                <ArrowRight aria-hidden="true" className="rtl:rotate-180" size={18} />
              </ButtonLink>
            </div>
          </div>
          <HeroJobBar />
        </PageContainer>
      </section>

      <FeaturedJobs />

      <section
        className="border-y border-white/10 bg-primary py-8 text-white sm:py-10"
        aria-labelledby="home-help-title"
      >
        <PageContainer>
          <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:gap-8 lg:gap-12">
            <div className="max-w-2xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 sm:text-sm">
                <Headset aria-hidden="true" className="size-4 text-light-green" />
                {t("We're Here to Help")}
              </p>
              <h2
                className="max-w-lg text-3xl leading-tight text-white sm:text-4xl rtl:leading-relaxed"
                id="home-help-title"
              >
                {t("Have questions? We're here for you.")}
              </h2>
              <p className="mt-3 max-w-xl text-base leading-7 text-white/85 rtl:leading-8">
                {t(
                  'Need help applying for jobs or preparing your CV? Our team is just a WhatsApp message away.',
                )}
              </p>
            </div>
            <div className="min-w-0 rounded-2xl border border-white/15 bg-brand-blue/20 p-5 text-white motion-safe:transition-colors motion-safe:duration-200 hover:border-white/30 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-light-green/20 bg-light-green/10 text-light-green">
                  <WhatsAppIcon className="size-7" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/80 rtl:leading-7">
                    {t('Reach us on WhatsApp')}
                  </p>
                  <p className="mt-1 text-xl font-bold tracking-wide sm:text-2xl">
                    <bdi dir="ltr">0339 7779779</bdi>
                  </p>
                </div>
              </div>
              <a
                aria-label={t('Chat with Rozgar Links on WhatsApp (opens in a new tab)')}
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-xl font-bold text-white motion-safe:transition-colors motion-safe:duration-200 hover:bg-brand-green/90 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
                href={whatsAppChatUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {t('Chat on WhatsApp')}
                <ArrowRight aria-hidden="true" className="rtl:rotate-180" size={18} />
              </a>
            </div>
          </div>
        </PageContainer>
      </section>
    </>
  );
}
