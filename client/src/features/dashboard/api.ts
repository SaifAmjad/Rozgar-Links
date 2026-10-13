import axios from 'axios';

import { statsResponseSchema, type StatsResponse } from '@rozgar-links/shared';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

export async function fetchStats(signal?: AbortSignal): Promise<StatsResponse> {
  const response = await axios.get(`${apiBaseUrl}/stats`, signal ? { signal } : undefined);
  return statsResponseSchema.parse(response.data);
}
