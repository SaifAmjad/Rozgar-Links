import { Link } from 'react-router-dom';

import { BrandLogo } from '../BrandLogo';
import { PageContainer } from './PageContainer';

const legalLinks = [
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
  { label: 'Fees & refunds', to: '/fees-and-refunds' },
];

export function Footer() {
  return (
    <footer className="border-t bg-surface">
      <PageContainer className="py-10 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-xl space-y-4">
            <BrandLogo />
            <p className="text-sm leading-6 text-muted">
              Rozgar Links is an independent service and is not affiliated with or endorsed by
              GulfTalent or NaukriGulf. Listings are shown for convenience; trademarks belong to
              their owners.
            </p>
            <p className="text-sm font-semibold text-primary">
              Employment is not guaranteed. Fee collection remains disabled pending legal and
              licence approval.
            </p>
          </div>

          <div>
            <h2 className="text-sm uppercase tracking-wider">Legal</h2>
            <ul className="mt-3 space-y-2">
              {legalLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    className="inline-flex min-h-11 items-center text-sm text-muted hover:text-primary"
                    to={link.to}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 text-sm text-muted">
            <h2 className="text-sm uppercase tracking-wider">Verification</h2>
            <p>Recruitment licence: PENDING-VERIFICATION</p>
            <p>Business contact: Pending owner verification</p>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
