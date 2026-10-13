import axios from 'axios';

import { jobsResponseSchema, type JobsResponse } from '@rozgar-links/shared';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

export interface JobsFilters {
  country?: string;
  field?: string;
  limit?: number;
  page?: number;
  q?: string;
}

export async function fetchJobs(
  filters: JobsFilters = {},
  signal?: AbortSignal,
): Promise<JobsResponse> {
  const response = await axios.get(`${apiBaseUrl}/jobs`, {
    params: filters,
    ...(signal ? { signal } : {}),
  });
  return jobsResponseSchema.parse(response.data);
}
