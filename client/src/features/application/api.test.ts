import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { applicationFieldsSchema } from '@rozgar-links/shared';

import { submitApplication, verifyCv } from './api';

const application = applicationFieldsSchema.parse({
  firstName: 'Test',
  lastName: 'Applicant',
  email: 'applicant@example.com',
  phone: '03001234567',
  countries: ['saudi-arabia'],
  field: 'construction',
  selectedJobIds: ['occupation-001'],
  cvPathType: 'new_cv_required',
});

const files = {
  cv: new File(['pdf'], 'resume.pdf', { type: 'application/pdf' }),
  paymentScreenshot: new File(['png'], 'payment.png', { type: 'image/png' }),
};

describe('application API', () => {
  it.each(['new_cv_required', 'existing_rozgar_cv'] as const)(
    'sends only the appropriate attachment for %s',
    async (cvPathType) => {
      const post = vi
        .spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { success: true, referenceId: 'RL-2026-ABC234' } });
      await submitApplication({ ...application, cvPathType }, files);
      const data = post.mock.calls.at(-1)?.[1] as FormData;
      expect(data.get('website')).toBe('');
      expect(data.has('cv')).toBe(cvPathType === 'existing_rozgar_cv');
      expect(data.has('paymentScreenshot')).toBe(cvPathType === 'new_cv_required');
    },
  );
  it('validates the verification response contract rather than trusting arbitrary flags', async () => {
    vi.spyOn(axios, 'post').mockResolvedValueOnce({ data: { valid: true } });
    await expect(verifyCv(files.cv)).rejects.toThrow();
  });
  it('returns a useful message when the hosting layer rejects oversized uploads', async () => {
    vi.spyOn(axios, 'post').mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 413 },
    });

    await expect(submitApplication(application, files)).rejects.toThrow(
      'The selected files are too large for this hosting service.',
    );
  });
});
