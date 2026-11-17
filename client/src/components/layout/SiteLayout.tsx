import { Outlet } from 'react-router-dom';

import { useLanguage } from '../../i18n/useLanguage';
import { LanguagePrompt } from '../../i18n/LanguagePrompt';
import { WhatsAppButton } from '../WhatsAppButton';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function SiteLayout() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        className="sr-only z-[60] rounded-xl bg-primary px-4 py-3 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        href="#main-content"
      >
        {t('Skip to main content')}
      </a>
      <Navbar />
      <main className="flex-1" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <LanguagePrompt />
    </div>
  );
}
