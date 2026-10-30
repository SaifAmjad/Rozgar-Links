import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { parseOccupationSeed, type OccupationCatalog } from '../jobs/occupationDirectory.js';
import type { JobProvider } from './JobProvider.js';

const defaultSeedFile = fileURLToPath(new URL('../../data/occupations.seed.json', import.meta.url));

export class ManualProvider implements JobProvider {
  readonly descriptor = {
    id: 'rozgar-links-occupation-directory',
    kind: 'directory' as const,
    label: 'Rozgar Link Master GCC Occupations & Salary Directory (2026)',
  };

  constructor(private readonly filePath = defaultSeedFile) {}

  async fetchJobs(): Promise<OccupationCatalog> {
    const serialized = await readFile(this.filePath, 'utf8');
    return parseOccupationSeed(JSON.parse(serialized));
  }
}
