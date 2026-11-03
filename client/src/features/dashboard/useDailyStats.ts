import { useCallback, useEffect, useState } from 'react';
import type { StatsResponse } from '@rozgar-links/shared';
import { fetchStats } from './api';

export const statsRefreshIntervalMs = 60_000;

// Vercel regenerates a deterministic snapshot on the first request for a new local
// date. Open browser tabs must make fresh requests too; no client-side cron is needed.
export function useDailyStats() {
  const [stats, setStats] = useState<StatsResponse>();
  const [error, setError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const retry = useCallback(() => {
    setError(false);
    setStats(undefined);
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    let disposed = false;
    let hasSnapshot = false;
    let controller: AbortController | undefined;
    async function refresh() {
      if (controller || disposed) return;
      controller = new AbortController();
      try {
        const snapshot = await fetchStats(controller.signal);
        if (!disposed) {
          hasSnapshot = true;
          setStats(snapshot);
          setError(false);
        }
      } catch {
        if (!disposed) {
          setError(!hasSnapshot);
          setStats((previous) => (previous ? { ...previous, isStale: true } : previous));
        }
      } finally {
        controller = undefined;
      }
    }
    const refreshWhenVisible = () => {
      if (document.visibilityState !== 'hidden') void refresh();
    };
    void refresh();
    const timer = window.setInterval(refreshWhenVisible, statsRefreshIntervalMs);
    window.addEventListener('focus', refreshWhenVisible);
    window.addEventListener('online', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      disposed = true;
      controller?.abort();
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshWhenVisible);
      window.removeEventListener('online', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [requestVersion]);
  return { stats, error, retry };
}
