import {
  ArrowRight,
  BriefcaseBusiness,
  ClipboardCheck,
  Globe2,
  Search,
  ShieldCheck,
} from 'lucide-react';

import { PageContainer } from '../components/layout/PageContainer';
import { Badge } from '../components/ui/Badge';
import { ButtonLink } from '../components/ui/ButtonLink';
import { Card } from '../components/ui/Card';
import { DashboardSection } from '../features/dashboard/DashboardSection';

const serviceCards = [
  {
    description: 'Review clearly labelled sample opportunities across the six GCC countries.',
    icon: Search,
    title: 'Explore sample listings',
  },
  {
    description: 'Understand the information and documents needed before an application opens.',
    icon: ClipboardCheck,
    title: 'Prepare with confidence',
  },
  {
    description: 'See transparent service, legal and fee information before sharing any details.',
    icon: ShieldCheck,
    title: 'Know the process',
  },
];

const processSteps = [
  ['1', 'Explore', 'Review sample listings and select a role that fits your experience.'],
  ['2', 'Prepare', 'Gather accurate details and approved documents for the guided application.'],
  [
    '3',
    'Submit',
    'Send once through the secure form when submission is enabled in a later milestone.',
  ],
];

export function HomePage() {
  return (
    <>
      <section className="bg-hero-gradient overflow-hidden text-white">
        <PageContainer className="relative py-16 sm:py-20 lg:py-24">
          <div
            aria-hidden="true"
            className="absolute -right-24 top-8 h-64 w-64 rounded-full border border-white/15"
          />
          <div
            aria-hidden="true"
            className="absolute -right-6 top-28 h-40 w-40 rounded-full border border-white/15"
          />
          <div className="relative max-w-3xl">
            <Badge tone="inverse">Independent hiring-assistance service</Badge>
            <h1 className="mt-5 text-3xl leading-tight text-white sm:text-5xl lg:text-6xl">
              Connecting People with Global Opportunities
            </h1>
            <p className="mt-5 font-urdu text-2xl leading-loose text-white" lang="ur" dir="rtl">
              لوگوں کو مواقع سے جوڑنا
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/90 sm:text-lg">
              A clear, guided way for applicants in Pakistan to explore sample Gulf opportunities
              and prepare for a secure application process.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/apply" variant="outline">
                View application process <ArrowRight aria-hidden="true" size={18} />
              </ButtonLink>
              <ButtonLink to="/jobs" variant="secondary">
                Browse sample jobs
              </ButtonLink>
            </div>
            <p className="mt-6 text-sm leading-6 text-white/85">
              No placement guarantee. Job listings and indicative figures are not live verification.
            </p>
          </div>
        </PageContainer>
      </section>

      <section className="py-14 sm:py-18" aria-labelledby="services-title">
        <PageContainer>
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
              Designed for clarity
            </p>
            <h2 className="mt-3 text-3xl" id="services-title">
              Start with the right information
            </h2>
            <p className="mt-3 leading-7 text-muted">
              Every section distinguishes samples, estimates and pending approvals from verified
              operational services.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {serviceCards.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.title}>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-blue/15 text-primary">
                    <Icon aria-hidden="true" size={22} />
                  </span>
                  <h3 className="mt-5 text-xl">{service.title}</h3>
                  <p className="mt-3 leading-7 text-muted">{service.description}</p>
                </Card>
              );
            })}
          </div>
        </PageContainer>
      </section>

      <DashboardSection />

      <section className="py-14 sm:py-18" aria-labelledby="jobs-preview-title">
        <PageContainer>
          <div className="grid gap-8 rounded-xl border bg-bg p-6 shadow-soft lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
            <div>
              <div className="flex items-center gap-3 text-primary">
                <BriefcaseBusiness aria-hidden="true" className="text-brand-green" size={24} />
                <span className="text-sm font-bold uppercase tracking-[0.18em]">
                  Sample directory
                </span>
              </div>
              <h2 className="mt-4 text-3xl" id="jobs-preview-title">
                Featured jobs will appear here
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-muted">
                Fictional examples will be marked “Sample listing” and will never include invented
                original-source links. The directory arrives in Milestone 5.
              </p>
            </div>
            <ButtonLink to="/jobs" variant="outline">
              View jobs page <ArrowRight aria-hidden="true" size={18} />
            </ButtonLink>
          </div>
        </PageContainer>
      </section>

      <section className="bg-surface py-14 sm:py-18" aria-labelledby="process-title">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <Globe2 aria-hidden="true" className="mx-auto text-brand-green" size={30} />
            <h2 className="mt-4 text-3xl" id="process-title">
              A simple three-part journey
            </h2>
            <p className="mt-3 leading-7 text-muted">
              The application workflow remains a demonstration until legal, privacy and licensing
              reviews are complete.
            </p>
          </div>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {processSteps.map(([number, title, description]) => (
              <li className="rounded-xl border bg-bg p-6 shadow-soft" key={number}>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-white">
                  {number}
                </span>
                <h3 className="mt-5 text-xl">{title}</h3>
                <p className="mt-3 leading-7 text-muted">{description}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center">
            <ButtonLink to="/faq" variant="outline">
              Read common questions
            </ButtonLink>
          </div>
        </PageContainer>
      </section>
    </>
  );
}
