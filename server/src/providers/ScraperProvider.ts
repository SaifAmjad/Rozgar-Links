import type { JobListing } from '@rozgar-links/shared';

import type { JobProvider } from './JobProvider.js';

export class ScraperProvider implements JobProvider {
  readonly descriptor = {
    id: 'external-scraper-disabled',
    kind: 'authorized' as const,
    label: 'External scraping disabled pending authorization',
  };

  async fetchJobs(): Promise<JobListing[]> {
    throw new Error(
      'External scraping is disabled pending documented permission and legal review.',
    );
  }
}
