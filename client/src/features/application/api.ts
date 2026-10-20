import axios from 'axios';

import {
  applicationSubmissionResponseSchema,
  jobTaxonomySchema,
  publicConfigResponseSchema,
  type ApplicationFields,
  type ApplicationSubmissionResponse,
  type JobTaxonomy,
  type PublicConfigResponse,
} from '@rozgar-links/shared';

import type { ApplicationFiles } from './fileValidation';

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

export async function submitApplication(
  fields: ApplicationFields,
  files: ApplicationFiles,
  website = '',
): Promise<ApplicationSubmissionResponse> {
  const formData = new FormData();
  formData.append('fields', JSON.stringify(fields));
  formData.append('website', website);
  if (files.cv) formData.append('cv', files.cv);
  if (files.paymentScreenshot) formData.append('paymentScreenshot', files.paymentScreenshot);

  try {
    const response = await axios.post(`${apiBaseUrl}/applications`, formData);
    return applicationSubmissionResponseSchema.parse(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error?.message;
      if (typeof message === 'string') throw new Error(message, { cause: error });
    }
    throw new Error('The application could not be submitted. Please try again.', { cause: error });
  }
}
