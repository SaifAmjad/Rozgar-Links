import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { jobTaxonomy, type PublicConfigResponse } from '@rozgar-links/shared';

import { fetchApplicationSetup, submitApplication } from './api';
import { ApplicationWizard } from './ApplicationWizard';
import { SuccessPage } from '../../pages/SuccessPage';

vi.mock('./api', () => ({ fetchApplicationSetup: vi.fn(), submitApplication: vi.fn() }));

const config: PublicConfigResponse = {
  bankAccountTitle: 'Rozgar Links Demo',
  bankName: 'Demo Bank',
  bankAccountNumber: 'DEMO-0000',
  bankIban: 'PK00DEMO0000000000000000',
  serviceFeeAmount: 2500,
  serviceFeeCurrency: 'PKR',
  taxonomyVersion: jobTaxonomy.version,
  isDemoPayment: true,
  applicationSubmissionEnabled: true,
};

function renderWizard(route = '/apply') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/apply" element={<ApplicationWizard />} />
        <Route path="/success" element={<SuccessPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function fillPersonalDetails() {
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Ayesha' } });
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Khan' } });
  fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1992-04-10' } });
  fireEvent.change(screen.getByLabelText(/^cnic/i), { target: { value: '12345-1234567-1' } });
  fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'ayesha@example.com' } });
  fireEvent.change(screen.getByLabelText(/phone \/ whatsapp/i), {
    target: { value: '03001234567' },
  });
  fireEvent.change(screen.getByLabelText(/current city/i), { target: { value: 'Lahore' } });
}

async function reachPreferences(route = '/apply') {
  renderWizard(route);
  fillPersonalDetails();
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  expect(await screen.findByRole('heading', { name: 'Preferences' })).toBeInTheDocument();
}

async function fillPreferences() {
  if (!(screen.getByLabelText('Saudi Arabia') as HTMLInputElement).checked) {
    fireEvent.click(screen.getByLabelText('Saudi Arabia'));
  }
  fireEvent.change(screen.getByLabelText(/job field/i), {
    target: { value: jobTaxonomy.fields[0]?.id },
  });
  fireEvent.change(screen.getByLabelText(/years of experience/i), { target: { value: '4' } });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  expect(await screen.findByRole('heading', { name: 'Documents' })).toBeInTheDocument();
}

async function reachReview() {
  await reachPreferences();
  await fillPreferences();

  const cv = new File(['demo cv'], 'demo-resume.pdf', { type: 'application/pdf' });
  fireEvent.change(screen.getByLabelText(/^cv/i), { target: { files: [cv] } });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  expect(await screen.findByRole('heading', { name: 'Payment' })).toBeInTheDocument();
  expect(screen.getByText(/test payment details/i)).toBeInTheDocument();

  const screenshot = new File(['demo payment'], 'demo-payment.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText(/payment screenshot/i), {
    target: { files: [screenshot] },
  });
  expect(screen.queryByLabelText(/transaction reference/i)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/payment date/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/required confirmations/i)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  expect(await screen.findByRole('heading', { name: 'Review' })).toBeInTheDocument();
}

describe('ApplicationWizard', () => {
  beforeEach(() => {
    vi.mocked(fetchApplicationSetup).mockResolvedValue({ config, taxonomy: jobTaxonomy });
    vi.mocked(submitApplication).mockReset();
    vi.mocked(submitApplication).mockResolvedValue({
      success: true,
      referenceId: 'RL-2026-ABC234',
    });
  });

  it('blocks incomplete personal details and announces errors', async () => {
    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('First name is required.');
    expect(screen.getByRole('heading', { name: 'Personal' })).toBeInTheDocument();
  });

  it('formats CNIC and removes non-digits from Pakistani phone input', () => {
    renderWizard();

    const cnic = screen.getByLabelText(/^cnic/i);
    const phone = screen.getByLabelText(/phone \/ whatsapp/i);
    fireEvent.change(cnic, { target: { value: '12345abc1234567z1' } });
    fireEvent.change(phone, { target: { value: '03ab001-23456789' } });

    expect(cnic).toHaveValue('12345-1234567-1');
    expect(phone).toHaveValue('03001234567');
    expect(phone).toHaveAttribute('maxlength', '11');
  });

  it('removes non-numeric characters from experience', async () => {
    await reachPreferences();

    const experience = screen.getByLabelText(/years of experience/i);
    fireEvent.change(experience, { target: { value: '4years' } });

    expect(experience).toHaveValue('4');
  });

  it('prefills recognized job choices and explains they can be changed', async () => {
    const field = jobTaxonomy.fields[0];
    if (!field) throw new Error('Expected a taxonomy field.');

    await reachPreferences(
      `/apply?country=Saudi%20Arabia&field=${encodeURIComponent(field.id)}&job=sample-001`,
    );
    expect(screen.getByLabelText('Saudi Arabia')).toBeChecked();
    expect(screen.getByLabelText(/job field/i)).toHaveValue(field.id);
    expect(screen.getByText(/job selected/i)).toBeInTheDocument();
  });

  it('shows a compact accessible progress indicator', () => {
    renderWizard();

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    expect(
      screen.getAllByText(/tell us who you are and how to contact you/i).length,
    ).toBeGreaterThan(0);
  });

  it('submits valid multipart data once and shows the server reference', async () => {
    await reachReview();
    expect(screen.getByText('••••5671')).toBeInTheDocument();
    expect(screen.getByText('Unverified demo evidence')).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: /submit application/i });
    await waitFor(() => expect(submitButton).toBeEnabled());
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    expect(
      await screen.findByRole('heading', { name: /application submitted/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('RL-2026-ABC234')).toBeInTheDocument();
    expect(submitApplication).toHaveBeenCalledTimes(1);
  });

  it('preserves selected files and allows retry after a submission failure', async () => {
    vi.mocked(submitApplication).mockRejectedValueOnce(
      new Error('Application email was not accepted.'),
    );
    await reachReview();

    const submitButton = screen.getByRole('button', { name: /submit application/i });
    await waitFor(() => expect(submitButton).toBeEnabled());
    fireEvent.click(submitButton);

    expect(await screen.findByRole('alert')).toHaveTextContent(/remain available for retry/i);
    expect(submitButton).toBeEnabled();
    const documentEditButton = screen.getAllByRole('button', { name: 'Edit' })[2];
    if (!documentEditButton) throw new Error('Expected the documents edit button.');
    fireEvent.click(documentEditButton);
    expect(await screen.findByText('Selected: demo-resume.pdf')).toBeInTheDocument();
  });

  it('clearly disables submission in hosted demo mode', async () => {
    vi.mocked(fetchApplicationSetup).mockResolvedValue({
      config: { ...config, applicationSubmissionEnabled: false },
      taxonomy: jobTaxonomy,
    });
    await reachReview();

    expect(screen.getByRole('status')).toHaveTextContent(/nothing is submitted/i);
    expect(screen.getByRole('button', { name: /submission disabled in demo/i })).toBeDisabled();
    expect(submitApplication).not.toHaveBeenCalled();
  });
});
