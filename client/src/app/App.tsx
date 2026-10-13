import { Route, Routes } from 'react-router-dom';

import { SiteLayout } from '../components/layout/SiteLayout';
import { ApplyPage } from '../pages/ApplyPage';
import { ContactPage } from '../pages/ContactPage';
import { FaqPage } from '../pages/FaqPage';
import { HomePage } from '../pages/HomePage';
import { JobsPage } from '../pages/JobsPage';
import { FeesRefundsPage, PrivacyPage, TermsPage } from '../pages/LegalPages';
import { NotFoundPage } from '../pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="apply" element={<ApplyPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="fees-and-refunds" element={<FeesRefundsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
