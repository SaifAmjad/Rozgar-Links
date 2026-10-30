import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { applicationFieldsSchema } from '@rozgar-links/shared';

import { submitApplication } from './api';

const application = applicationFieldsSchema.parse({
  firstName: 'Test',
  lastName: 'Applicant',
  dateOfBirth: '1990-01-01',
  nationalId: '12345-1234567-1',
  email: 'applicant@example.com',
  phone: '03001234567',
  currentCity: 'Lahore',
  countries: ['saudi-arabia'],
  field: 'construction',
  yearsExperience: 4,
});

const files = {
  cv: new File(['pdf'], 'resume.pdf', { type: 'application/pdf' }),
  paymentScreenshot: new File(['png'], 'payment.png', { type: 'image/png' }),
};

describe('application API', () => {
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
