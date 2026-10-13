import axios from 'axios';

import {
  jobTaxonomySchema,
  publicConfigResponseSchema,
  type JobTaxonomy,
  type PublicConfigResponse,
} from '@rozgar-links/shared';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

export async function fetchApplicationSetup(
  signal?: AbortSignal,
): Promise<{ config: PublicConfigResponse; taxonomy: JobTaxonomy }> {
  const requestOptions = signal ? { signal } : undefined;
  const [configResponse, taxonomyResponse] = await Promise.all([
    axios.get(`${apiBaseUrl}/config/public`, requestOptions),
    axios.get(`${apiBaseUrl}/taxonomy`, requestOptions),
  ]);

  return {
    config: publicConfigResponseSchema.parse(configResponse.data),
    taxonomy: jobTaxonomySchema.parse(taxonomyResponse.data),
  };
}
