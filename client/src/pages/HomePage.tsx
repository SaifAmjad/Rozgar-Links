import { ArrowRight, BarChart3, Search } from 'lucide-react';

import { PageContainer } from '../components/layout/PageContainer';
import { ButtonLink } from '../components/ui/ButtonLink';
import { HeroJobBar } from '../features/dashboard/HeroJobBar';
import { HowItWorksDialog } from '../features/home/HowItWorksDialog';
import { FeaturedJobs } from '../features/jobs/FeaturedJobs';
import { useLanguage } from '../i18n/useLanguage';

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

      <section className="bg-primary py-12 text-white sm:py-16" aria-labelledby="home-help-title">
        <PageContainer className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <BarChart3 aria-hidden="true" className="text-light-green" size={30} />
            <h2 className="mt-4 text-3xl text-white" id="home-help-title">
              {t('Not sure where to begin?')}
            </h2>
            <p className="mt-3 leading-7 text-white/85">
              {t(
                'Read the common questions first. They explain job listings, documents, fees and why no service can guarantee employment.',
              )}
            </p>
          </div>
          <ButtonLink className="w-full shrink-0 sm:w-auto" to="/faq" variant="outline">
            {t('Get simple answers')}{' '}
            <ArrowRight aria-hidden="true" className="rtl:rotate-180" size={18} />
          </ButtonLink>
        </PageContainer>
      </section>
    </>
  );
}
