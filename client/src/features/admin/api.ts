import axios from 'axios';
import {
  adminSessionSchema,
  cvReferenceSchema,
  type AdminLogin,
  type AuthenticatedAdminSession,
} from '@rozgar-links/shared';

const api = axios.create({
  baseURL: `${(import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')}/admin`,
  withCredentials: true,
  headers: { 'X-Admin-Request': '1' },
});

export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function failure(error: unknown): Promise<never> {
  if (axios.isAxiosError(error)) {
    let body: unknown = error.response?.data;
    if (body instanceof Blob && body.type.includes('json')) {
      try {
        body = JSON.parse(await body.text());
      } catch {
        body = undefined;
      }
    }
    const message = (body as { error?: { message?: unknown } } | undefined)?.error?.message;
    throw new AdminApiError(
      error.response?.status ?? 0,
      typeof message === 'string'
        ? message
        : 'The admin request could not be completed. Please try again.',
    );
  }
  throw new AdminApiError(0, 'The admin request could not be completed. Please try again.');
}

function authenticated(data: unknown): AuthenticatedAdminSession {
  const parsed = adminSessionSchema.parse(data);
  if (!parsed.authenticated) throw new AdminApiError(401, 'Please log in to continue.');
  return parsed;
}

export async function fetchAdminSession(): Promise<AuthenticatedAdminSession | null> {
  try {
    return authenticated((await api.get('/session')).data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) return null;
    return failure(error);
  }
}

export async function loginAdmin(credentials: AdminLogin) {
  try {
    return authenticated((await api.post('/login', credentials)).data);
  } catch (error) {
    return failure(error);
  }
}

export async function logoutAdmin(csrfToken: string) {
  try {
    await api.post('/logout', {}, { headers: { 'X-CSRF-Token': csrfToken } });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) return;
    return failure(error);
  }
}

export async function issueAdminCv(file: File, csrfToken: string) {
  const data = new FormData();
  data.append('cv', file);
  try {
    const response = await api.post<Blob>('/cv/issue', data, {
      responseType: 'blob',
      headers: { 'X-CSRF-Token': csrfToken },
    });
    const reference = cvReferenceSchema.parse(response.headers['x-cv-reference']);
    if (
      !(response.data instanceof Blob) ||
      !response.data.type.includes('application/pdf') ||
      !response.data.size
    )
      throw new Error('Invalid issuance response.');
    return { reference, pdf: response.data };
  } catch (error) {
    return failure(error);
  }
}
