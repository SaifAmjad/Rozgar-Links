import type { JobListing, JobsProvenance } from '@rozgar-links/shared';

export interface JobProviderDescriptor {
  id: string;
  kind: JobsProvenance['kind'];
  label: string;
}

export interface JobProvider {
  readonly descriptor: JobProviderDescriptor;
  fetchJobs(): Promise<JobListing[]>;
}
