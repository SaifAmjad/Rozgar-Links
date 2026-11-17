import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  jobTaxonomy,
  applicationOccupations,
  occupationDirectorySeed,
  occupationListingSchema,
  type PublicConfigResponse,
  type CvVerificationResponse,
} from '@rozgar-links/shared';
import { fetchApplicationSetup, submitApplication, verifyCv } from './api';
import { ApplicationWizard } from './ApplicationWizard';
import { browserSubmissionKey } from './browserSubmission';
import { SuccessPage } from '../../pages/SuccessPage';
import { ApplyPage } from '../../pages/ApplyPage';
import { JobCard } from '../jobs/JobCard';
import { LanguageProvider } from '../../i18n/LanguageProvider';
import { languageStorageKey, translate, type Language } from '../../i18n/translations';

vi.mock('./api', () => ({
  fetchApplicationSetup: vi.fn(),
  submitApplication: vi.fn(),
  verifyCv: vi.fn(),
}));
const config: PublicConfigResponse = {
  bankAccountTitle: 'Rozgar Links Demo',
  bankName: 'Demo Bank',
  bankAccountNumber: 'DEMO-0000',
  bankIban: 'PK00DEMO0000000000000000',
  serviceFeeAmount: 250,
  serviceFeeCurrency: 'PKR',
  taxonomyVersion: jobTaxonomy.version,
  isDemoPayment: true,
  applicationSubmissionEnabled: true,
};
const cvReference = 'RL-CV-2026-ABCDEFGH2345';
const pdf = () => new File(['test CV'], 'official.pdf', { type: 'application/pdf' });
const screenshot = () => new File(['test image'], 'payment.png', { type: 'image/png' });
const directoryJob = occupationListingSchema.parse({
  ...Object.fromEntries(
    Object.entries(occupationDirectorySeed.occupations[0] ?? {}).filter(
      ([key]) => key !== 'categoryId' && key !== 'salaryGroup',
    ),
  ),
  category: occupationDirectorySeed.categories[0],
  salaryCurrency: 'SAR',
  salaryPeriod: 'monthly',
  recordType: 'occupation_directory',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});
let language: Language = 'en';
const t = (message: string, values?: Record<string, string | number>) =>
  translate(language, message, values);
const jobLabel = (index = 0) => {
  const job = applicationOccupations[index];
  if (!job) throw new Error('Test occupation missing.');
  return language === 'ur' ? job.titleUr : job.titleEn;
};
async function renderWizard(lang: Language = 'en', route = '/apply') {
  language = lang;
  window.localStorage.setItem(languageStorageKey, lang);
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/jobs" element={<JobCard job={directoryJob} />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/success" element={<SuccessPage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
  if (route === '/jobs')
    fireEvent.click(screen.getByRole('link', { name: new RegExp(t('Apply now')) }));
  await screen.findByRole('option', { name: t('Construction') });
}
function change(name: string, value: string) {
  fireEvent.change(screen.getByLabelText(new RegExp(`^${t(name)}`)), { target: { value } });
}
async function proceed(name: string) {
  fireEvent.click(screen.getByRole('button', { name: t('Continue to {step}', { step: t(name) }) }));
  await screen.findByRole('heading', { level: 2, name: t(name) });
}
async function reachPreferences(lang: Language = 'en') {
  await renderWizard(lang);
  change('First name', 'Test');
  change('Last name', 'Applicant');
  change('Email address', 'test@example.invalid');
  change('WhatsApp number', '03001234567');
  change('Job field', 'construction');
  await proceed('Preferences');
}
async function reachCv(lang: Language = 'en') {
  await reachPreferences(lang);
  fireEvent.click(screen.getByLabelText(t('Saudi Arabia')));
  fireEvent.click(screen.getByRole('checkbox', { name: jobLabel() }));
  await proceed('CV Status');
}
async function chooseReturning() {
  fireEvent.click(
    screen.getByRole('radio', { name: new RegExp(t('Yes, I already have a Rozgar Links CV')) }),
  );
  fireEvent.change(screen.getByLabelText(new RegExp(`^${t('Official Rozgar Links CV')}`)), {
    target: { files: [pdf()] },
  });
  await screen.findByText(
    t(
      'Your Rozgar Links CV has been verified. You can submit your application without paying the CV preparation fee again.',
    ),
  );
}
async function reachNewReview(lang: Language = 'en') {
  await reachCv(lang);
  fireEvent.click(screen.getByRole('radio', { name: new RegExp(t('No, I need a new CV')) }));
  expect(
    screen.queryByLabelText(new RegExp(`^${t('Official Rozgar Links CV')}`)),
  ).not.toBeInTheDocument();
  await proceed('Payment');
  fireEvent.change(screen.getByLabelText(new RegExp(`^${t('Payment screenshot')}`)), {
    target: { files: [screenshot()] },
  });
  await proceed('Review');
}

describe('conditional application wizard', () => {
  beforeEach(() => {
    language = 'en';
    vi.mocked(fetchApplicationSetup)
      .mockReset()
      .mockResolvedValue({ config, taxonomy: jobTaxonomy });
    vi.mocked(submitApplication)
      .mockReset()
      .mockResolvedValue({ success: true, referenceId: 'RL-2026-ABC234' });
    vi.mocked(verifyCv).mockReset().mockResolvedValue({ valid: true, cvReference });
  });
  it.each(['en', 'ur'] as const)(
    'carries a clicked job through preferences, review and submission in %s',
    async (lang) => {
      await renderWizard(lang, '/jobs');
      expect(screen.getByRole('combobox', { name: new RegExp(t('Job field')) })).toHaveValue(
        'construction',
      );
      expect(
        screen.getByText(
          t('Preselected occupation: {job}. You can change it in step 2.', { job: jobLabel() }),
        ),
      ).toBeInTheDocument();
      change('First name', 'Test');
      change('Last name', 'Applicant');
      change('Email address', 'test@example.invalid');
      change('WhatsApp number', '03001234567');
      await proceed('Preferences');
      expect(screen.getByRole('checkbox', { name: jobLabel() })).toBeChecked();
      expect(screen.getByText(t('{count} of 3 jobs selected', { count: 1 }))).toBeInTheDocument();
      // A job link must not invent a preferred country from sample assignments.
      expect(screen.getByLabelText(t('Saudi Arabia'))).not.toBeChecked();
      fireEvent.click(screen.getByLabelText(t('Saudi Arabia')));
      await proceed('CV Status');
      await chooseReturning();
      await proceed('Review');
      expect(screen.getByText(jobLabel())).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: t('Submit application') }));
      await screen.findByRole('heading', { name: t('Application submitted') });
      expect(submitApplication).toHaveBeenCalledWith(
        expect.objectContaining({ field: 'construction', selectedJobIds: ['occupation-001'] }),
        expect.objectContaining({ cv: expect.any(File) }),
        '',
      );
    },
  );
  it('allows removing and changing a preselected occupation and clears incompatible choices', async () => {
    await renderWizard('en', '/apply?job=occupation-001&country=qatar');
    change('First name', 'Test');
    change('Last name', 'Applicant');
    change('Email address', 'test@example.invalid');
    change('WhatsApp number', '03001234567');
    await proceed('Preferences');
    expect(screen.getByLabelText('Qatar')).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: `Remove ${jobLabel()}` }));
    expect(screen.getByRole('checkbox', { name: jobLabel() })).not.toBeChecked();
    fireEvent.click(screen.getByRole('checkbox', { name: jobLabel(1) }));
    fireEvent.click(screen.getByRole('button', { name: 'Personal' }));
    change('Job field', 'healthcare');
    await proceed('Preferences');
    expect(screen.getByText('0 of 3 jobs selected')).toBeInTheDocument();
    expect(screen.getByLabelText('Qatar')).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Registered Staff Nurse' })).not.toBeChecked();
  });
  it('starts an ordinary application with no field or occupations selected', async () => {
    await renderWizard();
    expect(screen.getByRole('combobox', { name: /job field/i })).toHaveValue('');
    expect(screen.queryByText(/Preselected occupation:/)).not.toBeInTheDocument();
    change('First name', 'Test');
    change('Last name', 'Applicant');
    change('Email address', 'test@example.invalid');
    change('WhatsApp number', '03001234567');
    change('Job field', 'construction');
    await proceed('Preferences');
    expect(screen.getByText('0 of 3 jobs selected')).toBeInTheDocument();
  });
  it('resets preselection when navigating to ordinary Apply now or another job on the same page', async () => {
    render(
      <MemoryRouter initialEntries={['/apply?job=occupation-001']}>
        <Link to="/apply">Ordinary apply</Link>
        <Link to="/apply?job=occupation-058">Apply for nurse</Link>
        <Routes>
          <Route path="/apply" element={<ApplyPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /job field/i })).toHaveValue('construction'),
    );
    change('First name', 'Test');
    fireEvent.click(screen.getByRole('link', { name: 'Ordinary apply' }));
    await screen.findByRole('option', { name: 'Construction' });
    expect(screen.getByRole('combobox', { name: /job field/i })).toHaveValue('');
    expect(screen.getByLabelText(/First name/)).toHaveValue('');
    fireEvent.click(screen.getByRole('link', { name: 'Apply for nurse' }));
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /job field/i })).toHaveValue('healthcare'),
    );
    expect(screen.getByText(/Preselected occupation: Registered Staff Nurse/)).toBeInTheDocument();
  });
  it('requires personal fields including job field, omits removed fields and formats WhatsApp', async () => {
    await renderWizard();
    expect(
      screen.queryByLabelText(/cnic|date of birth|current city|passport|years of experience/i),
    ).not.toBeInTheDocument();
    change('WhatsApp number', '03ab001-23456789');
    expect(screen.getByLabelText(/^WhatsApp/)).toHaveValue('03001234567');
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('First name is required.');
    expect(screen.getByRole('combobox', { name: /job field/i })).toBeInTheDocument();
  });
  it('requires occupations and limits selections to three removable jobs', async () => {
    await reachPreferences();
    fireEvent.click(screen.getByLabelText('Saudi Arabia'));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least one occupation/i);
    for (let index = 0; index < 3; index++)
      fireEvent.click(screen.getByRole('checkbox', { name: jobLabel(index) }));
    expect(screen.getByText('3 of 3 jobs selected')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: jobLabel(3) })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: `Remove ${jobLabel()}` }));
    expect(screen.getByRole('checkbox', { name: jobLabel(3) })).toBeEnabled();
    change('Search occupations', applicationOccupations[3]?.titleEn ?? '');
    expect(
      screen.getAllByRole('checkbox').some((element) => element.getAttribute('disabled') === ''),
    ).toBe(false);
  });
  it('reconciles job selections when changing field while preserving countries', async () => {
    await reachCv();
    fireEvent.click(screen.getByRole('button', { name: 'Personal' }));
    change('Job field', 'healthcare');
    await proceed('Preferences');
    expect(screen.getByLabelText('Saudi Arabia')).toBeChecked();
    expect(screen.getByText('0 of 3 jobs selected')).toBeInTheDocument();
    expect(screen.getByText(/selected jobs were removed/i)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: jobLabel() })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Registered Staff Nurse' })).toBeInTheDocument();
  });
  it('offers education occupations, explains the chosen field and preserves All Gulf expansion', async () => {
    await reachPreferences();
    fireEvent.click(screen.getByLabelText('All Gulf countries'));
    expect(screen.getByLabelText('Saudi Arabia')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Personal' }));
    change('Job field', 'education');
    await proceed('Preferences');
    expect(
      screen.getByText('You selected Education in step 1. These occupations match your job field.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/No matching occupations/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Primary School Teacher' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Teaching Assistant' }));
    expect(screen.getByText('2 of 3 jobs selected')).toBeInTheDocument();
    expect(screen.getByLabelText('All Gulf countries')).toBeChecked();
    await proceed('CV Status');
  });
  it('shows the chosen field and education labels in Urdu', async () => {
    await reachPreferences('ur');
    fireEvent.click(screen.getByRole('button', { name: t('Personal') }));
    change('Job field', 'education');
    await proceed('Preferences');
    expect(
      screen.getByText(
        t('You selected {field} in step 1. These occupations match your job field.', {
          field: t('Education'),
        }),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'پرائمری اسکول ٹیچر' })).toBeInTheDocument();
  });
  it.each(['en', 'ur'] as const)(
    'submits a new-CV request with payment only in %s',
    async (lang) => {
      await reachNewReview(lang);
      expect(document.documentElement.dir).toBe(lang === 'ur' ? 'rtl' : 'ltr');
      expect(screen.getByText('PKR 250')).toBeInTheDocument();
      expect(screen.getByText(t('Attached, awaiting manual verification'))).toBeInTheDocument();
      const button = screen.getByRole('button', { name: t('Submit application') });
      await waitFor(() => expect(button).toBeEnabled());
      fireEvent.click(button);
      fireEvent.click(button);
      await screen.findByRole('heading', { name: t('Application submitted') });
      expect(submitApplication).toHaveBeenCalledTimes(1);
      const [fields, files] = vi.mocked(submitApplication).mock.calls[0] ?? [];
      expect(fields).toMatchObject({
        selectedJobIds: ['occupation-001'],
        cvPathType: 'new_cv_required',
      });
      expect(files?.cv).toBeUndefined();
      expect(files?.paymentScreenshot?.name).toBe('payment.png');
    },
  );
  it.each(['en', 'ur'] as const)(
    'verifies an official CV and skips payment in %s',
    async (lang) => {
      await reachCv(lang);
      await chooseReturning();
      await proceed('Review');
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '4');
      expect(screen.queryByRole('button', { name: t('Payment') })).not.toBeInTheDocument();
      expect(screen.getByText(cvReference)).toBeInTheDocument();
      expect(screen.getByText('PKR 0')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: t('Back') }));
      await screen.findByRole('heading', { level: 2, name: t('CV Status') });
      await proceed('Review');
      fireEvent.click(screen.getByRole('button', { name: t('Submit application') }));
      await screen.findByRole('heading', { name: t('Application submitted') });
      const [fields, files] = vi.mocked(submitApplication).mock.calls[0] ?? [];
      expect(fields?.cvPathType).toBe('existing_rozgar_cv');
      expect(files?.cv?.name).toBe('official.pdf');
      expect(files?.paymentScreenshot).toBeUndefined();
    },
  );
  it('blocks invalid CVs and never grants payment exemption', async () => {
    vi.mocked(verifyCv).mockResolvedValue({
      valid: false,
      message: 'This document could not be verified as an official Rozgar Links CV.',
    });
    await reachCv();
    fireEvent.click(screen.getByRole('radio', { name: /Yes, I already/ }));
    fireEvent.change(screen.getByLabelText(/^Official Rozgar Links CV/), {
      target: { files: [pdf()] },
    });
    await screen.findByText(/This document could not be verified/);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/verified official PDF/);
    expect(submitApplication).not.toHaveBeenCalled();
  });
  it('clears payment state on switching journeys and ignores late verification results', async () => {
    await reachNewReview();
    fireEvent.click(screen.getByRole('button', { name: 'CV Status' }));
    let resolveVerification!: (value: CvVerificationResponse) => void;
    vi.mocked(verifyCv).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveVerification = resolve;
        }),
    );
    fireEvent.click(screen.getByRole('radio', { name: /Yes, I already/ }));
    fireEvent.change(screen.getByLabelText(/^Official Rozgar Links CV/), {
      target: { files: [pdf()] },
    });
    expect(await screen.findByText(/Checking your official/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /No, I need/ }));
    await act(async () => resolveVerification({ valid: true, cvReference }));
    await proceed('Payment');
    expect(screen.queryByText(/Selected: payment.png/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Payment screenshot is required/);
  });
  it('retains files for retry after SMTP failure', async () => {
    vi.mocked(submitApplication).mockRejectedValueOnce(
      new Error('Application email was not accepted.'),
    );
    await reachNewReview();
    fireEvent.click(screen.getByRole('button', { name: 'Submit application' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/remain available for retry/);
    fireEvent.click(screen.getByRole('button', { name: 'Edit payment screenshot' }));
    expect(screen.getByText('Selected: payment.png')).toBeInTheDocument();
  });
  it('keeps demo submission disabled', async () => {
    vi.mocked(fetchApplicationSetup).mockResolvedValue({
      config: { ...config, applicationSubmissionEnabled: false },
      taxonomy: jobTaxonomy,
    });
    await reachNewReview();
    expect(screen.getByRole('button', { name: 'Submission disabled in demo' })).toBeDisabled();
    expect(submitApplication).not.toHaveBeenCalled();
  });
  it('blocks the form on a later visit from a submitted browser', async () => {
    await reachNewReview();
    fireEvent.click(screen.getByRole('button', { name: 'Submit application' }));
    await screen.findByRole('heading', { name: 'Application submitted' });
    expect(window.localStorage.getItem(browserSubmissionKey)).toBe('true');
    render(
      <MemoryRouter>
        <ApplicationWizard />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { name: 'Application already submitted' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
    expect(submitApplication).toHaveBeenCalledTimes(1);
  });
  it('blocks an open form when another tab records a successful submission', async () => {
    await reachNewReview();
    act(() => {
      window.localStorage.setItem(browserSubmissionKey, 'true');
      window.dispatchEvent(
        new StorageEvent('storage', { key: browserSubmissionKey, newValue: 'true' }),
      );
    });
    expect(
      screen.getByRole('heading', { name: 'Application already submitted' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit application' })).not.toBeInTheDocument();
    expect(submitApplication).not.toHaveBeenCalled();
  });
  it('shows the browser submission notice in Urdu', async () => {
    window.localStorage.setItem(browserSubmissionKey, 'true');
    window.localStorage.setItem(languageStorageKey, 'ur');
    render(
      <LanguageProvider>
        <MemoryRouter>
          <ApplicationWizard />
        </MemoryRouter>
      </LanguageProvider>,
    );
    expect(
      screen.getByRole('heading', { name: translate('ur', 'Application already submitted') }),
    ).toBeInTheDocument();
    expect(submitApplication).not.toHaveBeenCalled();
  });
});
