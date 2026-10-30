import type { OccupationCatalog } from '../jobs/occupationDirectory.js';

export interface JobProviderDescriptor {
  id: string;
  kind: 'directory';
  label: string;
}

export interface JobProvider {
  readonly descriptor: JobProviderDescriptor;
  fetchJobs(): Promise<OccupationCatalog>;
}
