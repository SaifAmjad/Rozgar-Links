import type { OccupationCatalog } from '../jobs/occupationDirectory.js';
import type { JobProvider } from './JobProvider.js';

export class ScraperProvider implements JobProvider {
  readonly descriptor = {
    id: 'scraper-disabled',
    kind: 'directory' as const,
    label: 'Scraping disabled',
  };

  async fetchJobs(): Promise<OccupationCatalog> {
    throw new Error('Scraping is disabled pending documented authorization and legal review.');
  }
}
