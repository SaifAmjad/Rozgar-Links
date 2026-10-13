import {
  statsHistoryResponseSchema,
  statsResponseSchema,
  type StatsHistoryResponse,
  type StatsResponse,
} from '@rozgar-links/shared';

import { StatsRepository } from '../repositories/statsRepository.js';
import {
  generateStatsHistory,
  generateStatsSnapshot,
  getDateInTimeZone,
} from './statsGenerator.js';

export class StatsUnavailableError extends Error {
  constructor() {
    super('No statistics are currently available.');
    this.name = 'StatsUnavailableError';
  }
}

interface StatsServiceOptions {
  generate?: typeof generateStatsSnapshot;
  now?: () => Date;
  repository?: StatsRepository;
  timeZone: string;
}

export class StatsService {
  private readonly generate: typeof generateStatsSnapshot;
  private readonly now: () => Date;
  private readonly repository: StatsRepository;

  constructor({
    generate = generateStatsSnapshot,
    now = () => new Date(),
    repository = new StatsRepository(),
    timeZone,
  }: StatsServiceOptions) {
    this.generate = generate;
    this.now = now;
    this.repository = repository;
    this.timeZone = timeZone;
  }

  private readonly timeZone: string;

  async ensureToday(): Promise<StatsResponse> {
    const today = getDateInTimeZone(this.now(), this.timeZone);
    const storedToday = await this.repository.findByDate(today);

    if (storedToday.snapshot) {
      return statsResponseSchema.parse({
        ...storedToday.snapshot,
        isStale: storedToday.recoveredFromMemory,
      });
    }

    try {
      const snapshot = this.generate(today, this.timeZone);
      await this.repository.save(snapshot);
      return snapshot;
    } catch {
      const latest = await this.repository.findLatest();

      if (!latest.snapshot) {
        throw new StatsUnavailableError();
      }

      return statsResponseSchema.parse({ ...latest.snapshot, isStale: true });
    }
  }

  async getHistory(days: number): Promise<StatsHistoryResponse> {
    const current = await this.ensureToday();
    const persistedTrend = new Map(
      current.last7Days.map((entry) => [entry.date, entry.totalOpenings]),
    );
    const entries = generateStatsHistory(current.date, days).map((entry) => ({
      ...entry,
      totalOpenings: persistedTrend.get(entry.date) ?? entry.totalOpenings,
    }));

    return statsHistoryResponseSchema.parse({
      days,
      entries,
      lastUpdated: current.lastUpdated,
      provenance: current.provenance,
      isStale: current.isStale,
    });
  }
}
