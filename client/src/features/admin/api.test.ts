import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAdminSession, issueAdminCv, loginAdmin, logoutAdmin } from './api';

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('axios', async (original) => {
  const module = await original<typeof import('axios')>();
  return { default: { ...module.default, create: vi.fn(() => http) } };
});
const session = {
  authenticated: true,
  csrfToken: 'x'.repeat(43),
  expiresAt: '2030-01-01T00:00:00.000Z',
  maxUploadBytes: 5 * 1024 * 1024,
};
beforeEach(() => {
  http.get.mockReset();
  http.post.mockReset();
});
describe('admin API transport', () => {
  it('uses cookie credentials and the admin request header, and treats 401 as unauthenticated', async () => {
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ withCredentials: true, headers: { 'X-Admin-Request': '1' } }),
    );
    http.get.mockRejectedValue({ isAxiosError: true, response: { status: 401 } });
    expect(await fetchAdminSession()).toBeNull();
    expect(http.get).toHaveBeenCalledWith('/session');
  });
  it('parses minimal sessions and sends the CSRF token on logout', async () => {
    http.post.mockResolvedValue({ data: session });
    expect(await loginAdmin({ username: 'test-admin', password: 'Test password only!' })).toEqual(
      session,
    );
    await logoutAdmin(session.csrfToken);
    expect(http.post).toHaveBeenLastCalledWith(
      '/logout',
      {},
      { headers: { 'X-CSRF-Token': session.csrfToken } },
    );
  });
  it('uploads one PDF with CSRF and validates the returned download reference', async () => {
    const pdf = new Blob(['issued'], { type: 'application/pdf' });
    const reference = 'RL-CV-2026-ABCDEFGH2345';
    http.post.mockResolvedValue({ data: pdf, headers: { 'x-cv-reference': reference } });
    const file = new File(['input'], 'test.pdf', { type: 'application/pdf' });
    expect(await issueAdminCv(file, session.csrfToken)).toEqual({ reference, pdf });
    const [path, data, options] = http.post.mock.calls[0]!;
    expect(path).toBe('/cv/issue');
    expect(Array.from((data as FormData).keys())).toEqual(['cv']);
    expect(options).toEqual({
      responseType: 'blob',
      headers: { 'X-CSRF-Token': session.csrfToken },
    });
    http.post.mockResolvedValue({ data: pdf, headers: { 'x-cv-reference': '../unsafe' } });
    await expect(issueAdminCv(file, session.csrfToken)).rejects.toThrow(/could not be completed/);
  });
  it('extracts safe server errors from binary upload responses', async () => {
    const error = Object.assign(new Blob([], { type: 'application/json' }), {
      text: async () => JSON.stringify({ error: { message: 'Invalid PDF.' } }),
    });
    http.post.mockRejectedValue({ isAxiosError: true, response: { status: 400, data: error } });
    await expect(
      issueAdminCv(new File(['input'], 'test.pdf'), session.csrfToken),
    ).rejects.toMatchObject({ status: 400, message: 'Invalid PDF.' });
  });
});
