import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  FileCheck2,
  Search,
} from 'lucide-react';

import { PageContainer } from '../components/layout/PageContainer';
import { ButtonLink } from '../components/ui/ButtonLink';
import { HeroJobBar } from '../features/dashboard/HeroJobBar';
import { FeaturedJobs } from '../features/jobs/FeaturedJobs';

const processSteps = [
  {
    description: 'Choose a country and type of work that matches your experience.',
    icon: BriefcaseBusiness,
    title: 'Choose work',
  },
  {
    description: 'Keep your passport, contact details and test documents ready.',
    icon: FileCheck2,
    title: 'Prepare details',
  },
  {
    description: 'Follow the five clear application steps and review everything at the end.',
    icon: CheckCircle2,
    title: 'Check and finish',
  },
] as const;

export function HomePage() {
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

        <PageContainer className="relative py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl leading-[1.08] text-white sm:text-5xl lg:text-6xl">
              Find your next Gulf opportunity.
            </h1>
            <p
              className="mt-3 font-urdu text-xl leading-loose text-white/90 sm:text-2xl"
              dir="rtl"
              lang="ur"
            >
              لوگوں کو مواقع سے جوڑنا
            </p>
            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
              Explore jobs by country and apply with clear, simple guidance.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink className="w-full sm:w-auto" to="/jobs" variant="outline">
                <Search aria-hidden="true" size={18} /> Find jobs
              </ButtonLink>
              <ButtonLink className="w-full sm:w-auto" to="/apply" variant="secondary">
                Start application <ArrowRight aria-hidden="true" size={18} />
              </ButtonLink>
            </div>
          </div>
          <HeroJobBar />
        </PageContainer>
      </section>

      <section className="border-y bg-surface py-12 sm:py-16" aria-labelledby="process-title">
        <PageContainer>
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-green">
              How it works
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl" id="process-title">
              Three clear stages
            </h2>
          </div>
          <ol className="mt-8 grid gap-4 lg:grid-cols-3">
            {processSteps.map(({ description, icon: Icon, title }, index) => (
              <li className="relative rounded-xl border bg-bg p-5 sm:p-6" key={title}>
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-black text-white">
                    {index + 1}
                  </span>
                  <Icon aria-hidden="true" className="text-brand-green" size={26} />
                </div>
                <h3 className="mt-5 text-xl">{title}</h3>
                <p className="mt-2 leading-7 text-muted">{description}</p>
              </li>
            ))}
          </ol>
        </PageContainer>
      </section>

      <FeaturedJobs />

      <section className="bg-primary py-12 text-white sm:py-16" aria-labelledby="home-help-title">
        <PageContainer className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <BarChart3 aria-hidden="true" className="text-light-green" size={30} />
            <h2 className="mt-4 text-3xl text-white" id="home-help-title">
              Not sure where to begin?
            </h2>
            <p className="mt-3 leading-7 text-white/85">
              Read the common questions first. They explain job listings, documents, fees and why no
              service can guarantee employment.
            </p>
          </div>
          <ButtonLink className="w-full shrink-0 sm:w-auto" to="/faq" variant="outline">
            Get simple answers <ArrowRight aria-hidden="true" size={18} />
          </ButtonLink>
        </PageContainer>
      </section>
    </>
  );
}
