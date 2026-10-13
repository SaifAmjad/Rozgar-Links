import { describe, expect, it } from 'vitest';

import { maximumUploadBytes, validateApplicationFile } from './fileValidation';

describe('application file validation', () => {
  it('requires a CV and payment screenshot', () => {
    expect(validateApplicationFile('cv')).toBe('CV is required.');
    expect(validateApplicationFile('paymentScreenshot')).toBe('Payment screenshot is required.');
    expect(validateApplicationFile('photo')).toBeUndefined();
  });

  it('checks both allowlisted MIME types and extensions', () => {
    const disguisedExecutable = new File(['test'], 'resume.pdf', {
      type: 'application/x-msdownload',
    });
    const wrongExtension = new File(['test'], 'resume.exe', { type: 'application/pdf' });

    expect(validateApplicationFile('cv', disguisedExecutable)).toMatch(/unsupported/i);
    expect(validateApplicationFile('cv', wrongExtension)).toMatch(/unsupported/i);
  });

  it('rejects files larger than five MiB', () => {
    const largeFile = new File([new Uint8Array(maximumUploadBytes + 1)], 'resume.pdf', {
      type: 'application/pdf',
    });

    expect(validateApplicationFile('cv', largeFile)).toMatch(/5 MiB/i);
  });
});
