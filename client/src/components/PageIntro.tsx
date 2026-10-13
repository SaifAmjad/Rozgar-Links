import type { ReactNode } from 'react';

import { PageContainer } from './layout/PageContainer';

interface PageIntroProps {
  actions?: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}

export function PageIntro({ actions, description, eyebrow, title }: PageIntroProps) {
  return (
    <section className="border-b bg-surface py-12 sm:py-16">
      <PageContainer>
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          <h1 className="mt-3 text-3xl sm:text-4xl">{title}</h1>
          <p className="mt-4 text-base leading-7 text-muted sm:text-lg">{description}</p>
          {actions ? <div className="mt-7 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </PageContainer>
    </section>
  );
}
