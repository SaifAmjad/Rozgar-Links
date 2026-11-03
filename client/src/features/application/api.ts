import axios from 'axios';

import {
  applicationSubmissionResponseSchema,
  jobTaxonomySchema,
  publicConfigResponseSchema,
  cvVerificationResponseSchema,
  type ApplicationFields,
  type ApplicationSubmissionResponse,
  type JobTaxonomy,
  type PublicConfigResponse,
} from '@rozgar-links/shared';

import type { ApplicationFiles } from './fileValidation';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

export async function verifyCv(file: File, signal?: AbortSignal) {
  const data = new FormData();
  data.append('cv', file);
  const response = await axios.post(
    `${apiBaseUrl}/cv/verify`,
    data,
    signal ? { signal } : undefined,
  );
  return cvVerificationResponseSchema.parse(response.data);
}

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
  if (fields.cvPathType === 'existing_rozgar_cv' && files.cv) formData.append('cv', files.cv);
  if (fields.cvPathType === 'new_cv_required' && files.paymentScreenshot)
    formData.append('paymentScreenshot', files.paymentScreenshot);

  try {
    const response = await axios.post(`${apiBaseUrl}/applications`, formData);
    return applicationSubmissionResponseSchema.parse(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 413) {
        throw new Error(
          'The selected files are too large for this hosting service. Please choose smaller files and try again.',
          { cause: error },
        );
      }
      const message = error.response?.data?.error?.message;
      if (typeof message === 'string') throw new Error(message, { cause: error });
    }
    throw new Error('The application could not be submitted. Please try again.', { cause: error });
  }
}
