// A browser preference only, not a server-side identity or security control.
// No applicant details, documents or references are stored.
export const browserSubmissionKey = 'rozgar-links-application-submitted';
const submissionLockName = 'rozgar-links-application-submission';

export class BrowserAlreadySubmittedError extends Error {
  constructor() {
    super('An application has already been submitted from this browser.');
  }
}

export function hasBrowserSubmitted() {
  try {
    return window.localStorage.getItem(browserSubmissionKey) === 'true';
  } catch {
    return false;
  }
}

export async function submitOncePerBrowser<T>(send: () => Promise<T>): Promise<T> {
  const submit = async () => {
    const probeKey = `${browserSubmissionKey}-check`;
    try {
      if (window.localStorage.getItem(browserSubmissionKey) === 'true')
        throw new BrowserAlreadySubmittedError();
      window.localStorage.setItem(probeKey, 'true');
      window.localStorage.removeItem(probeKey);
    } catch (error) {
      if (error instanceof BrowserAlreadySubmittedError) throw error;
      throw new Error('Browser storage is unavailable. Enable site storage before submitting.', {
        cause: error,
      });
    }
    // Failure must leave no success marker, so the applicant can retry.
    const result = await send();
    try {
      window.localStorage.setItem(browserSubmissionKey, 'true');
    } catch {
      // SMTP has already accepted the application. Never misreport it as failed or
      // invite another submission because storage settings changed during the request.
    }
    return result;
  };
  // Serialize submissions from cooperating tabs when the browser supports Web Locks.
  // A waiting tab rechecks the marker after the first tab finishes.
  return navigator.locks ? navigator.locks.request(submissionLockName, submit) : submit();
}
