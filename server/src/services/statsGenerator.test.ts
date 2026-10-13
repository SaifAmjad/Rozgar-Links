import { describe, expect, it } from 'vitest';

import {
  generateStatsHistory,
  generateStatsSnapshot,
  getDateInTimeZone,
} from './statsGenerator.js';

describe('stats generator', () => {
  it('produces the same coherent snapshot for the same date and timezone', () => {
    const first = generateStatsSnapshot('2026-10-13', 'Asia/Karachi');
    const second = generateStatsSnapshot('2026-10-13', 'Asia/Karachi');

    expect(first).toEqual(second);
    expect(first.byCountry.reduce((sum, entry) => sum + entry.count, 0)).toBe(first.totalOpenings);
    expect(first.byField.reduce((sum, entry) => sum + entry.count, 0)).toBe(first.totalOpenings);
    expect(first.newToday).toBeGreaterThanOrEqual(0);
    expect(first.newToday).toBeLessThanOrEqual(first.totalOpenings);
  });

  it('varies totals by date and keeps history chronological', () => {
    const history = generateStatsHistory('2026-10-13', 7);

    expect(history).toHaveLength(7);
    expect(history[0]?.date).toBe('2026-10-07');
    expect(history.at(-1)?.date).toBe('2026-10-13');
    expect(new Set(history.map((entry) => entry.totalOpenings)).size).toBeGreaterThan(1);
    history.slice(1).forEach((entry, index) => {
      const previousTotal = history[index]!.totalOpenings;
      const dailyVariation = Math.abs(entry.totalOpenings - previousTotal) / previousTotal;
      expect(dailyVariation).toBeGreaterThanOrEqual(0.05);
      expect(dailyVariation).toBeLessThanOrEqual(0.12);
    });
  });

  it('rolls over at midnight in the configured timezone', () => {
    expect(getDateInTimeZone(new Date('2026-01-01T18:59:59.000Z'), 'Asia/Karachi')).toBe(
      '2026-01-01',
    );
    expect(getDateInTimeZone(new Date('2026-01-01T19:00:00.000Z'), 'Asia/Karachi')).toBe(
      '2026-01-02',
    );
  });
});
