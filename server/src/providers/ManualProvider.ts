import { readFile } from 'node:fs/promises';
import { occupationDirectorySeed } from '@rozgar-links/shared';

import { parseOccupationSeed, type OccupationCatalog } from '../jobs/occupationDirectory.js';
import type { JobProvider } from './JobProvider.js';

export class ManualProvider implements JobProvider {
  readonly descriptor = {
    id: 'rozgar-links-occupation-directory',
    kind: 'directory' as const,
    label: 'Rozgar Link Master GCC Occupations & Salary Directory (2026)',
  };

  constructor(private readonly filePath?: string) {}

  async fetchJobs(): Promise<OccupationCatalog> {
    return parseOccupationSeed(
      this.filePath ? JSON.parse(await readFile(this.filePath, 'utf8')) : occupationDirectorySeed,
    );
  }
}
