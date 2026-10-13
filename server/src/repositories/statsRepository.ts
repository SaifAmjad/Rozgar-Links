import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { statsResponseSchema, type StatsResponse } from '@rozgar-links/shared';
import { z } from 'zod';

const statsStoreSchema = z
  .object({
    version: z.literal(1),
    snapshots: z.array(statsResponseSchema).max(31),
  })
  .strict();

type StatsStore = z.infer<typeof statsStoreSchema>;

export interface StoredStatsResult {
  recoveredFromMemory: boolean;
  snapshot: StatsResponse | undefined;
}

const defaultStatsFile = fileURLToPath(new URL('../../data/stats.json', import.meta.url));

function cloneStore(store: StatsStore): StatsStore {
  return structuredClone(store);
}

export class StatsRepository {
  private lastValidStore: StatsStore | undefined;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath = defaultStatsFile) {}

  private async readStore(): Promise<{ recoveredFromMemory: boolean; store: StatsStore }> {
    await this.writeQueue;

    try {
      const serialized = await readFile(this.filePath, 'utf8');
      const store = statsStoreSchema.parse(JSON.parse(serialized));
      this.lastValidStore = cloneStore(store);
      return { recoveredFromMemory: false, store };
    } catch (error) {
      if (this.lastValidStore) {
        return { recoveredFromMemory: true, store: cloneStore(this.lastValidStore) };
      }

      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { recoveredFromMemory: false, store: { version: 1, snapshots: [] } };
      }

      return { recoveredFromMemory: false, store: { version: 1, snapshots: [] } };
    }
  }

  async findByDate(date: string): Promise<StoredStatsResult> {
    const { recoveredFromMemory, store } = await this.readStore();
    return {
      recoveredFromMemory,
      snapshot: store.snapshots.find((snapshot) => snapshot.date === date),
    };
  }

  async findLatest(): Promise<StoredStatsResult> {
    const { recoveredFromMemory, store } = await this.readStore();
    return {
      recoveredFromMemory,
      snapshot: [...store.snapshots].sort((left, right) => right.date.localeCompare(left.date))[0],
    };
  }

  async save(snapshot: StatsResponse) {
    const validatedSnapshot = statsResponseSchema.parse(snapshot);
    const write = this.writeQueue
      .catch(() => undefined)
      .then(async () => {
        const { store } = await this.readStoreWithoutWaiting();
        const snapshots = store.snapshots
          .filter((entry) => entry.date !== validatedSnapshot.date)
          .concat(validatedSnapshot)
          .sort((left, right) => left.date.localeCompare(right.date))
          .slice(-31);
        const nextStore = statsStoreSchema.parse({ version: 1, snapshots });
        const directory = dirname(this.filePath);
        const temporaryFile = `${directory}/.${basename(this.filePath)}.${process.pid}.tmp`;

        await mkdir(directory, { recursive: true });

        try {
          await writeFile(temporaryFile, `${JSON.stringify(nextStore, null, 2)}\n`, {
            encoding: 'utf8',
            mode: 0o600,
          });
          await rename(temporaryFile, this.filePath);
          this.lastValidStore = cloneStore(nextStore);
        } finally {
          await rm(temporaryFile, { force: true });
        }
      });

    this.writeQueue = write.catch(() => undefined);
    await write;
  }

  private async readStoreWithoutWaiting(): Promise<{
    recoveredFromMemory: boolean;
    store: StatsStore;
  }> {
    try {
      const serialized = await readFile(this.filePath, 'utf8');
      const store = statsStoreSchema.parse(JSON.parse(serialized));
      this.lastValidStore = cloneStore(store);
      return { recoveredFromMemory: false, store };
    } catch (error) {
      if (this.lastValidStore) {
        return { recoveredFromMemory: true, store: cloneStore(this.lastValidStore) };
      }

      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { recoveredFromMemory: false, store: { version: 1, snapshots: [] } };
      }

      return { recoveredFromMemory: false, store: { version: 1, snapshots: [] } };
    }
  }
}
