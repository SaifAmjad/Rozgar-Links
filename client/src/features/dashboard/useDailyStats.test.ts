import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StatsResponse } from '@rozgar-links/shared';
import { fetchStats } from './api';
import { statsRefreshIntervalMs, useDailyStats } from './useDailyStats';

vi.mock('./api', () => ({ fetchStats: vi.fn() }));
const today: StatsResponse = {
  date: '2026-11-03',
  totalOpenings: 1525,
  byCountry: [],
  byField: [],
  newToday: 135,
  last7Days: [],
  lastUpdated: '2026-11-02T19:05:00.000Z',
  provenance: 'estimated',
  isStale: false,
};
const tomorrow = { ...today, date: '2026-11-04', totalOpenings: 1410 };

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(fetchStats).mockReset().mockResolvedValue(today);
});
afterEach(() => {
  vi.useRealTimers();
});

describe('daily stats browser refresh', () => {
  it('refreshes an open page and displays a new server snapshot without reload', async () => {
    const { result } = renderHook(useDailyStats);
    await act(async () => {});
    expect(result.current.stats?.date).toBe('2026-11-03');
    vi.mocked(fetchStats).mockResolvedValueOnce(tomorrow);
    await act(async () => {
      vi.advanceTimersByTime(statsRefreshIntervalMs);
    });
    expect(result.current.stats?.date).toBe('2026-11-04');
    expect(result.current.stats?.totalOpenings).toBe(1410);
  });
  it('refreshes when returning to the tab or reconnecting', async () => {
    const { result } = renderHook(useDailyStats);
    await act(async () => {});
    vi.mocked(fetchStats).mockResolvedValue(tomorrow);
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(result.current.stats?.date).toBe('2026-11-04');
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });
    expect(fetchStats).toHaveBeenCalledTimes(3);
  });
  it('preserves last figures as stale on a refresh failure and automatically recovers', async () => {
    const { result } = renderHook(useDailyStats);
    await act(async () => {});
    vi.mocked(fetchStats).mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      vi.advanceTimersByTime(statsRefreshIntervalMs);
    });
    expect(result.current.stats?.totalOpenings).toBe(1525);
    expect(result.current.stats?.isStale).toBe(true);
    expect(result.current.error).toBe(false);
    vi.mocked(fetchStats).mockResolvedValueOnce(tomorrow);
    await act(async () => {
      vi.advanceTimersByTime(statsRefreshIntervalMs);
    });
    expect(result.current.stats?.date).toBe('2026-11-04');
    expect(result.current.stats?.isStale).toBe(false);
  });
  it('aborts pending requests and removes timers on unmount', async () => {
    vi.mocked(fetchStats).mockImplementation(() => new Promise(() => {}));
    const { unmount } = renderHook(useDailyStats);
    const signal = vi.mocked(fetchStats).mock.calls[0]?.[0];
    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      vi.advanceTimersByTime(statsRefreshIntervalMs * 2);
      window.dispatchEvent(new Event('focus'));
    });
    expect(fetchStats).toHaveBeenCalledTimes(1);
  });
});
