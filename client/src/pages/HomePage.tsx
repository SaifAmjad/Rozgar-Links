import {
  ArrowRight,
  BarChart3,
  Check,
  ClipboardCheck,
  FileCheck2,
  Globe2,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { PageContainer } from '../components/layout/PageContainer';
import { Badge } from '../components/ui/Badge';
import { ButtonLink } from '../components/ui/ButtonLink';
import { DashboardSection } from '../features/dashboard/DashboardSection';
import { FeaturedJobs } from '../features/jobs/FeaturedJobs';

const trustPoints = [
  {
    description:
      'Every fictional opportunity is clearly marked and never linked to an invented source.',
    icon: Search,
    label: 'Explore transparently',
  },
  {
    description:
      'Daily patterns are presented as indicative estimates, never live verified openings.',
    icon: BarChart3,
    label: 'Compare with context',
  },
  {
    description: 'The guided form validates details and documents before secure email delivery.',
    icon: ShieldCheck,
    label: 'Prepare carefully',
  },
];

const journeySteps = [
  {
    description: 'Browse clearly labelled sample roles across six Gulf countries.',
    icon: Search,
    title: 'Explore opportunities',
  },
  {
    description: 'Review requirements and organise accurate information before applying.',
    icon: ClipboardCheck,
    title: 'Prepare your profile',
  },
  {
    description: 'Complete the guided five-step workflow using test documents during this demo.',
    icon: FileCheck2,
    title: 'Submit with clarity',
  },
];

const platformFacts = [
  ['6', 'Gulf countries'],
  ['12', 'Career fields'],
  ['5-step', 'Guided workflow'],
];

export function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-hero-gradient text-white">
        <div
          aria-hidden="true"
          className="absolute -right-32 -top-36 h-96 w-96 rounded-full border border-white/15 bg-white/5"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full border border-white/10 bg-brand-green/20"
        />

        <PageContainer className="relative py-14 sm:py-18 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
            <div className="max-w-3xl">
              <Badge tone="inverse">
                <Sparkles aria-hidden="true" className="mr-1.5" size={14} />
                Independent hiring-assistance service
              </Badge>
              <h1 className="mt-6 text-4xl leading-[1.08] text-white sm:text-5xl lg:text-6xl">
                Connecting people with global opportunities
              </h1>
              <p
                className="mt-5 max-w-max border-l-2 border-light-green pl-4 font-urdu text-2xl leading-loose text-white sm:text-3xl"
                dir="rtl"
                lang="ur"
              >
                لوگوں کو مواقع سے جوڑنا
              </p>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/90 sm:text-lg sm:leading-8">
                Explore sample Gulf roles, understand indicative opportunity patterns and prepare a
                complete application through one clear, guided experience.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink to="/jobs" variant="outline">
                  Browse sample jobs <ArrowRight aria-hidden="true" size={18} />
                </ButtonLink>
                <ButtonLink to="/apply" variant="secondary">
                  Start demo application
                </ButtonLink>
              </div>

              <div className="mt-8 flex items-start gap-3 border-t border-white/15 pt-5 text-sm leading-6 text-white/85">
                <ShieldCheck
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-light-green"
                  size={19}
                />
                <p>
                  Sample listings and indicative figures only. No placement guarantee. Payment
                  evidence is not verification.
                </p>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:mx-0">
              <div
                aria-hidden="true"
                className="absolute -inset-3 rounded-xl border border-white/10 bg-white/5"
              />
              <div className="relative rounded-xl border border-white/20 bg-bg p-5 text-text shadow-soft sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-green">
                      Your starting point
                    </p>
                    <h2 className="mt-2 text-2xl">A clearer path forward</h2>
                  </div>
                  <Badge tone="warning">Demo experience</Badge>
                </div>

                <ol className="mt-2 divide-y">
                  {journeySteps.map(({ description, icon: Icon, title }, index) => (
                    <li className="flex gap-4 py-5" key={title}>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-primary">
                        <Icon aria-hidden="true" size={21} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-brand-green">0{index + 1}</span>
                          <h3 className="text-base">{title}</h3>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="rounded-xl bg-surface p-4">
                  <div className="flex gap-3">
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-brand-green"
                      size={19}
                    />
                    <p className="text-sm leading-6 text-muted">
                      Clear labels distinguish samples, estimates and pending approvals at every
                      stage.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <dl className="mt-12 grid grid-cols-3 divide-x divide-white/15 border-y border-white/15 py-5 sm:max-w-2xl lg:mt-16">
            {platformFacts.map(([value, label]) => (
              <div className="px-3 first:pl-0 sm:px-6 sm:first:pl-0" key={label}>
                <dt className="text-xs leading-5 text-white/75 sm:text-sm">{label}</dt>
                <dd className="mt-1 text-xl font-black text-white sm:text-2xl">{value}</dd>
              </div>
            ))}
          </dl>
        </PageContainer>
      </section>

      <section className="relative bg-bg py-14 sm:py-18" aria-labelledby="trust-title">
        <PageContainer>
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-12">
            <div className="lg:sticky lg:top-28">
              <div className="flex items-center gap-3 text-brand-green">
                <Globe2 aria-hidden="true" size={23} />
                <p className="text-sm font-black uppercase tracking-[0.18em]">
                  Built around clarity
                </p>
              </div>
              <h2 className="mt-4 text-3xl sm:text-4xl" id="trust-title">
                Make informed decisions before you apply
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-muted">
                Rozgar Links brings discovery, context and preparation together without presenting
                demonstration data as verified recruitment activity.
              </p>
              <ButtonLink className="mt-6" to="/faq" variant="outline">
                Understand the process
              </ButtonLink>
            </div>

            <div className="grid gap-4">
              {trustPoints.map(({ description, icon: Icon, label }, index) => (
                <article
                  className="group grid gap-4 rounded-xl border bg-surface p-5 transition-colors hover:border-accent-blue sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6"
                  key={label}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg text-primary shadow-soft">
                    <Icon aria-hidden="true" size={23} />
                  </span>
                  <div>
                    <h3 className="text-lg">{label}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted sm:text-base">{description}</p>
                  </div>
                  <span className="hidden text-sm font-black text-accent-blue sm:block">
                    0{index + 1}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      <DashboardSection />

      <FeaturedJobs />

      <section className="bg-surface py-14 sm:py-18" aria-labelledby="process-title">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <Globe2 aria-hidden="true" className="mx-auto text-brand-green" size={30} />
            <h2 className="mt-4 text-3xl" id="process-title">
              Ready to explore the process?
            </h2>
            <p className="mt-3 leading-7 text-muted">
              The workflow remains a demonstration until legal, privacy and licensing reviews are
              complete. Use test information and documents only.
            </p>
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to="/jobs">Browse sample jobs</ButtonLink>
            <ButtonLink to="/apply" variant="outline">
              View application steps
            </ButtonLink>
          </div>
        </PageContainer>
      </section>
    </>
  );
}
