import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { jobTaxonomy, type PublicConfigResponse } from '@rozgar-links/shared';

import { fetchApplicationSetup, submitApplication } from './api';
import { ApplicationWizard } from './ApplicationWizard';

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
};

function renderWizard(route = '/apply') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ApplicationWizard />
    </MemoryRouter>,
  );
}

function fillPersonalDetails() {
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Ayesha' } });
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Khan' } });
  fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1992-04-10' } });
  fireEvent.change(screen.getByLabelText(/^nationality/i), { target: { value: 'Pakistani' } });
  fireEvent.change(screen.getByLabelText(/national id/i), { target: { value: '12345-1234567-1' } });
  fireEvent.change(screen.getByLabelText(/passport number/i), { target: { value: 'AB123456' } });
  fireEvent.change(screen.getByLabelText(/passport expiry/i), { target: { value: '2030-12-31' } });
  fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'ayesha@example.com' } });
  fireEvent.change(screen.getByLabelText(/phone \/ whatsapp/i), { target: { value: '+923001234567' } });
  fireEvent.change(screen.getByLabelText(/current city/i), { target: { value: 'Lahore' } });
  fireEvent.change(screen.getByLabelText(/current country/i), { target: { value: 'Pakistan' } });
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
  fireEvent.click(screen.getByLabelText(jobTaxonomy.fields[0]?.roles[0]?.label ?? ''));
  fireEvent.change(screen.getByLabelText(/years of experience/i), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText(/highest education/i), { target: { value: 'Diploma' } });
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
  expect(screen.getByText(/fake \/ demo bank details/i)).toBeInTheDocument();

  const screenshot = new File(['demo payment'], 'demo-payment.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText(/payment screenshot/i), {
    target: { files: [screenshot] },
  });
  fireEvent.change(screen.getByLabelText(/transaction reference/i), {
    target: { value: 'DEMO-TXN-01' },
  });
  fireEvent.change(screen.getByLabelText(/payment date/i), { target: { value: '2026-10-01' } });
  fireEvent.click(screen.getByLabelText(/accept the terms/i));
  fireEvent.click(screen.getByLabelText(/information is complete/i));
  fireEvent.click(screen.getByLabelText(/accept the fee and refund policy/i));
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
      confirmationEmailSent: false,
    });
  });

  it('blocks incomplete personal details and announces errors', async () => {
    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('First name is required.');
    expect(screen.getByRole('heading', { name: 'Personal' })).toBeInTheDocument();
  });

  it('prefills only a recognized Gulf country from the jobs query', async () => {
    await reachPreferences('/apply?country=Saudi%20Arabia&job=sample-001');
    expect(screen.getByLabelText('Saudi Arabia')).toBeChecked();
  });

  it('clears incompatible roles when the selected field changes', async () => {
    await reachPreferences();
    const firstField = jobTaxonomy.fields[0];
    const secondField = jobTaxonomy.fields[1];
    if (!firstField || !secondField) throw new Error('Expected taxonomy fields.');

    fireEvent.change(screen.getByLabelText(/job field/i), { target: { value: firstField.id } });
    fireEvent.click(screen.getByLabelText(firstField.roles[0]?.label ?? ''));
    fireEvent.change(screen.getByLabelText(/job field/i), { target: { value: secondField.id } });
    fireEvent.change(screen.getByLabelText(/years of experience/i), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText(/highest education/i), { target: { value: 'Diploma' } });
    fireEvent.click(screen.getByLabelText('Saudi Arabia'));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Select at least one role.');
  });

  it('requires details when Other is selected', async () => {
    await reachPreferences();
    fireEvent.change(screen.getByLabelText(/job field/i), {
      target: { value: jobTaxonomy.fields[0]?.id },
    });
    fireEvent.click(screen.getByLabelText('Other'));

    expect(screen.getByLabelText(/describe the other role/i)).toBeRequired();
  });

  it('submits valid multipart data once and reports SMTP-confirmation status accurately', async () => {
    await reachReview();
    expect(screen.getByText('••••5671')).toBeInTheDocument();
    expect(screen.getByText('Unverified demo evidence')).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: /submit application/i });
    await waitFor(() => expect(submitButton).toBeEnabled());
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    expect(await screen.findByText(/reference: RL-2026-ABC234/i)).toBeInTheDocument();
    expect(screen.getByText(/no applicant confirmation email was sent/i)).toBeInTheDocument();
    expect(submitApplication).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Submitted' })).toBeDisabled();
  });

  it('preserves selected files and allows retry after a submission failure', async () => {
    vi.mocked(submitApplication).mockRejectedValueOnce(new Error('Application email was not accepted.'));
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
});
