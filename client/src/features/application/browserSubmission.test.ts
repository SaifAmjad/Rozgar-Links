import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BrowserAlreadySubmittedError,
  browserSubmissionKey,
  hasBrowserSubmitted,
  submitOncePerBrowser,
} from './browserSubmission';

const originalLocks = Object.getOwnPropertyDescriptor(navigator, 'locks');
afterEach(() => {
  vi.restoreAllMocks();
  if (originalLocks) Object.defineProperty(navigator, 'locks', originalLocks);
  else Reflect.deleteProperty(navigator, 'locks');
});

describe('one successful submission per browser', () => {
  it('does not record a success while the request is still pending', async () => {
    let accept!: (value: string) => void;
    const pending = submitOncePerBrowser(
      () =>
        new Promise<string>((resolve) => {
          accept = resolve;
        }),
    );
    expect(hasBrowserSubmitted()).toBe(false);
    accept('accepted');
    await pending;
    expect(hasBrowserSubmitted()).toBe(true);
  });
  it('stores only a boolean marker after success and blocks subsequent requests', async () => {
    const send = vi.fn().mockResolvedValue({ success: true, referenceId: 'RL-2026-ABC234' });
    expect(hasBrowserSubmitted()).toBe(false);
    await submitOncePerBrowser(send);
    expect(window.localStorage.getItem(browserSubmissionKey)).toBe('true');
    expect(window.localStorage.length).toBe(1);
    expect(hasBrowserSubmitted()).toBe(true);
    await expect(submitOncePerBrowser(send)).rejects.toBeInstanceOf(BrowserAlreadySubmittedError);
    expect(send).toHaveBeenCalledTimes(1);
  });
  it('allows retry after a failed submission', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error('SMTP failure'))
      .mockResolvedValueOnce('accepted');
    await expect(submitOncePerBrowser(send)).rejects.toThrow('SMTP failure');
    expect(hasBrowserSubmitted()).toBe(false);
    expect(window.localStorage.length).toBe(0);
    await expect(submitOncePerBrowser(send)).resolves.toBe('accepted');
  });
  it('serializes cooperating tabs with Web Locks and checks again inside the lock', async () => {
    let queue: Promise<unknown> = Promise.resolve();
    const request = vi.fn((_name: string, action: () => Promise<unknown>) => {
      const next = queue.then(action);
      queue = next.catch(() => undefined);
      return next;
    });
    Object.defineProperty(navigator, 'locks', { configurable: true, value: { request } });
    const send = vi.fn().mockResolvedValue('accepted');
    const first = submitOncePerBrowser(send);
    const second = expect(submitOncePerBrowser(send)).rejects.toBeInstanceOf(
      BrowserAlreadySubmittedError,
    );
    await expect(first).resolves.toBe('accepted');
    await second;
    expect(request).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenCalledTimes(1);
  });
  it('does not send an application when browser storage is blocked', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('Storage blocked');
      },
    });
    const send = vi.fn();
    try {
      await expect(submitOncePerBrowser(send)).rejects.toThrow(/Enable site storage/);
      expect(send).not.toHaveBeenCalled();
    } finally {
      if (descriptor) Object.defineProperty(window, 'localStorage', descriptor);
    }
  });
});
