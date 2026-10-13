import { describe, expect, it } from 'vitest';

import { statsHistoryResponseSchema, statsResponseSchema } from './stats.js';

const validStats = {
  date: '2026-10-13',
  totalOpenings: 12,
  byCountry: [
    { country: 'Saudi Arabia', count: 2 },
    { country: 'United Arab Emirates', count: 2 },
    { country: 'Oman', count: 2 },
    { country: 'Qatar', count: 2 },
    { country: 'Kuwait', count: 2 },
    { country: 'Bahrain', count: 2 },
  ],
  byField: [
    'Construction',
    'Hospitality',
    'Healthcare',
    'Information Technology',
    'Oil and Gas',
    'Logistics',
    'Retail',
    'Drivers and Transport',
    'Security',
    'Engineering',
    'Administration',
    'Education',
  ].map((field) => ({ field, count: 1 })),
  newToday: 2,
  last7Days: [
    '2026-10-07',
    '2026-10-08',
    '2026-10-09',
    '2026-10-10',
    '2026-10-11',
    '2026-10-12',
    '2026-10-13',
  ].map((date) => ({ date, totalOpenings: 12 })),
  lastUpdated: '2026-10-12T19:05:00.000Z',
  provenance: 'estimated' as const,
  isStale: false,
};

describe('stats schemas', () => {
  it('accepts a coherent daily snapshot', () => {
    expect(statsResponseSchema.parse(validStats)).toEqual(validStats);
  });

  it('rejects mismatched country and field totals', () => {
    expect(() =>
      statsResponseSchema.parse({
        ...validStats,
        byCountry: validStats.byCountry.map((entry, index) =>
          index === 0 ? { ...entry, count: 3 } : entry,
        ),
      }),
    ).toThrow(/country totals/i);
  });

  it('rejects non-chronological history', () => {
    expect(() =>
      statsHistoryResponseSchema.parse({
        days: 2,
        entries: [validStats.last7Days[1], validStats.last7Days[0]],
        lastUpdated: validStats.lastUpdated,
        provenance: 'estimated',
        isStale: false,
      }),
    ).toThrow(/chronological/i);
  });
});
