import { Link } from 'react-router-dom';

import { PageContainer } from '../components/layout/PageContainer';
import { useLanguage } from '../i18n/useLanguage';

export function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <PageContainer className="py-20 text-center sm:py-28">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">{t('404 error')}</p>
      <h1 className="mt-3 text-4xl">{t('Page not found')}</h1>
      <p className="mt-4 text-muted">{t('The page you requested is not available.')}</p>
      <Link
        className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-brand-blue px-5 py-2.5 font-bold text-white hover:bg-primary"
        to="/"
      >
        {t('Return home')}
      </Link>
    </PageContainer>
  );
}
