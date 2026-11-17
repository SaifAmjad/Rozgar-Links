import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminPanel } from './AdminPanel';
import { AdminApiError, fetchAdminSession, issueAdminCv, loginAdmin, logoutAdmin } from './api';

vi.mock('./api', async (original) => ({
  ...(await original<typeof import('./api')>()),
  fetchAdminSession: vi.fn(),
  loginAdmin: vi.fn(),
  issueAdminCv: vi.fn(),
  logoutAdmin: vi.fn(),
}));
const session = {
  authenticated: true as const,
  csrfToken: 'x'.repeat(43),
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  maxUploadBytes: 5 * 1024 * 1024,
};
const reference = 'RL-CV-2026-ABCDEFGH2345';
const pdf = () => new File(['%PDF-1.7 test'], 'test-cv.pdf', { type: 'application/pdf' });
function show(route = '/admin/login') {
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/admin/*" element={<AdminPanel />} />
      </Routes>
    </MemoryRouter>,
  );
}
async function showCv() {
  vi.mocked(fetchAdminSession).mockResolvedValue(session);
  show('/admin/cv');
  await screen.findByRole('heading', { name: 'Issue Official Rozgar Links CV' });
}
function upload(file = pdf()) {
  fireEvent.change(screen.getByLabelText(/Completed CV upload/), { target: { files: [file] } });
}
beforeEach(() => {
  vi.mocked(fetchAdminSession).mockReset().mockResolvedValue(null);
  vi.mocked(loginAdmin).mockReset().mockResolvedValue(session);
  vi.mocked(logoutAdmin).mockReset().mockResolvedValue(undefined);
  vi.mocked(issueAdminCv)
    .mockReset()
    .mockResolvedValue({ reference, pdf: new Blob(['issued'], { type: 'application/pdf' }) });
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:test-official-cv'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
});
afterEach(() => {
  vi.useRealTimers();
});

describe('admin browser workflow', () => {
  it('protects the issuance page and validates login without calling the API', async () => {
    show('/admin/cv');
    await screen.findByRole('heading', { name: 'Admin login' });
    expect(screen.queryByLabelText(/Completed CV upload/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your username and password.');
    expect(loginAdmin).not.toHaveBeenCalled();
    const password = screen.getByLabelText(/^Password/);
    expect(password).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
  });
  it('shows a generic login failure, clears the password and permits retry', async () => {
    vi.mocked(loginAdmin).mockRejectedValueOnce(
      new AdminApiError(401, 'Invalid username or password.'),
    );
    show();
    await screen.findByRole('heading', { name: 'Admin login' });
    fireEvent.change(screen.getByLabelText(/^Username/), { target: { value: 'test-admin' } });
    fireEvent.change(screen.getByLabelText(/^Password/), {
      target: { value: 'Test password only!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password.');
    expect(screen.getByLabelText(/^Password/)).toHaveValue('');
    fireEvent.change(screen.getByLabelText(/^Password/), {
      target: { value: 'Test password only!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await screen.findByRole('heading', { name: 'Issue Official Rozgar Links CV' });
    expect(window.localStorage.length).toBe(0);
  });
  it('restores a session, uploads one PDF, downloads the result and revokes it on logout', async () => {
    await showCv();
    expect(screen.getByRole('button', { name: 'Generate Official CV' })).toBeDisabled();
    upload();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Official CV' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Official CV generated and verified.',
    );
    expect(issueAdminCv).toHaveBeenCalledWith(expect.any(File), session.csrfToken);
    expect(screen.getByText(reference)).toBeInTheDocument();
    const download = screen.getByRole('link', { name: 'Download Official CV' });
    expect(download).toHaveAttribute('href', 'blob:test-official-cv');
    expect(download).toHaveAttribute('download', `${reference}.pdf`);
    expect(screen.getByRole('button', { name: 'Generate Official CV' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    await screen.findByRole('heading', { name: 'Admin login' });
    expect(logoutAdmin).toHaveBeenCalledWith(session.csrfToken);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-official-cv');
    expect(window.localStorage.length).toBe(0);
  });
  it('rejects wrong file types and oversized PDFs before upload', async () => {
    await showCv();
    upload(new File(['not pdf'], 'not.pdf', { type: 'text/plain' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Choose a PDF/);
    upload(
      new File([new Uint8Array(session.maxUploadBytes + 1)], 'oversize.pdf', {
        type: 'application/pdf',
      }),
    );
    expect(screen.getByRole('button', { name: 'Generate Official CV' })).toBeDisabled();
    expect(issueAdminCv).not.toHaveBeenCalled();
  });
  it('prevents repeated generation while pending and reports server validation errors', async () => {
    let reject!: (error: Error) => void;
    vi.mocked(issueAdminCv).mockImplementationOnce(
      () =>
        new Promise((_resolve, rejectRequest) => {
          reject = rejectRequest;
        }),
    );
    await showCv();
    upload();
    const button = screen.getByRole('button', { name: 'Generate Official CV' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(issueAdminCv).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Generating official CV…' })).toBeDisabled();
    await act(async () => reject(new AdminApiError(400, 'Invalid PDF.')));
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid PDF.');
    expect(screen.getByRole('button', { name: 'Generate Official CV' })).toBeEnabled();
  });
  it('redirects to login when issuance discovers an expired session', async () => {
    vi.mocked(issueAdminCv).mockRejectedValueOnce(
      new AdminApiError(401, 'Please log in to continue.'),
    );
    await showCv();
    upload();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Official CV' }));
    await screen.findByRole('heading', { name: 'Admin login' });
    expect(screen.queryByRole('link', { name: 'Download Official CV' })).not.toBeInTheDocument();
  });
  it('rechecks session on focus and removes private UI when it expires', async () => {
    await showCv();
    vi.mocked(fetchAdminSession).mockResolvedValueOnce(null);
    act(() => window.dispatchEvent(new Event('focus')));
    await screen.findByRole('heading', { name: 'Admin login' });
    expect(screen.queryByLabelText(/Completed CV upload/)).not.toBeInTheDocument();
  });
  it('expires the UI at the signed session deadline without waiting for a request', async () => {
    vi.useFakeTimers();
    const deadline = Date.now() + 60_000;
    vi.mocked(fetchAdminSession).mockResolvedValue({
      ...session,
      expiresAt: new Date(deadline).toISOString(),
    });
    await act(async () => {
      show('/admin/cv');
    });
    expect(
      screen.getByRole('heading', { name: 'Issue Official Rozgar Links CV' }),
    ).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_001);
    });
    expect(screen.getByRole('heading', { name: 'Admin login' })).toBeInTheDocument();
  });
});
