import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StatsResponse } from '@rozgar-links/shared';

import { fetchStats } from './api';
import { DashboardSection } from './DashboardSection';

vi.mock('./api', () => ({ fetchStats: vi.fn() }));

const stats: StatsResponse = {
  date: '2026-10-13',
  totalOpenings: 1480,
  byCountry: [
    { country: 'Saudi Arabia', count: 500 },
    { country: 'United Arab Emirates', count: 400 },
    { country: 'Oman', count: 100 },
    { country: 'Qatar', count: 180 },
    { country: 'Kuwait', count: 170 },
    { country: 'Bahrain', count: 130 },
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
  ].map((field, index) => ({ field, count: index === 0 ? 380 : 100 })),
  newToday: 90,
  last7Days: [
    '2026-10-07',
    '2026-10-08',
    '2026-10-09',
    '2026-10-10',
    '2026-10-11',
    '2026-10-12',
    '2026-10-13',
  ].map((date, index) => ({ date, totalOpenings: 1400 + index * 10 + 20 })),
  lastUpdated: '2026-10-12T19:05:00.000Z',
  provenance: 'estimated',
  isStale: false,
};

describe('DashboardSection', () => {
  beforeEach(() => {
    vi.mocked(fetchStats).mockReset();
  });

  it('renders loading and then one API response across cards and accessible chart alternatives', async () => {
    vi.mocked(fetchStats).mockResolvedValue(stats);
    render(<DashboardSection />);

    expect(
      screen.getByRole('status', { name: /loading daily opportunity overview/i }),
    ).toBeInTheDocument();
    expect((await screen.findAllByText('1,480')).length).toBeGreaterThan(0);
    expect(await screen.findByRole('heading', { name: 'Openings by country' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Country' })).toBeInTheDocument();
    expect(screen.getAllByText('Indicative figures, updated daily').length).toBeGreaterThan(1);
  });

  it('announces an API error and retries without inventing values', async () => {
    vi.mocked(fetchStats).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(stats);
    render(<DashboardSection />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/temporarily unavailable/i);
    expect(screen.queryByText('1,480')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    await waitFor(() => expect(fetchStats).toHaveBeenCalledTimes(2));
    expect((await screen.findAllByText('1,480')).length).toBeGreaterThan(0);
  });

  it('labels stale estimates explicitly', async () => {
    vi.mocked(fetchStats).mockResolvedValue({ ...stats, isStale: true });
    render(<DashboardSection />);

    expect((await screen.findAllByText(/last valid update shown/i)).length).toBeGreaterThan(1);
  });
});
