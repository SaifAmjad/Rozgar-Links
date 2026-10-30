import axios from 'axios';

import {
  jobsResponseSchema,
  type JobsResponse,
  type JobsSort,
  type SalaryBandId,
} from '@rozgar-links/shared';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

export interface JobsFilters {
  category?: string;
  country?: string;
  customMax?: number;
  customMin?: number;
  designation?: string;
  language?: 'en' | 'ur';
  limit?: number;
  page?: number;
  q?: string;
  salary?: SalaryBandId[];
  sort?: JobsSort;
}

export async function fetchJobs(
  filters: JobsFilters = {},
  signal?: AbortSignal,
): Promise<JobsResponse> {
  const response = await axios.get(`${apiBaseUrl}/jobs`, {
    params: {
      ...filters,
      ...(filters.salary?.length ? { salary: filters.salary.join(',') } : {}),
    },
    ...(signal ? { signal } : {}),
  });
  return jobsResponseSchema.parse(response.data);
}
