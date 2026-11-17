import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StatsResponse } from '@rozgar-links/shared';

import { fetchStats } from './api';
import { HeroJobBar } from './HeroJobBar';

vi.mock('./api', () => ({ fetchStats: vi.fn() }));

const stats: StatsResponse = {
  date: '2026-10-20',
  totalOpenings: 1480,
  byCountry: [
    { country: 'Saudi Arabia', count: 500 },
    { country: 'United Arab Emirates', count: 400 },
    { country: 'Oman', count: 100 },
    { country: 'Qatar', count: 180 },
    { country: 'Kuwait', count: 170 },
    { country: 'Bahrain', count: 130 },
  ],
  byField: [],
  newToday: 90,
  last7Days: [],
  lastUpdated: '2026-10-19T19:05:00.000Z',
  provenance: 'estimated',
  isStale: false,
};

describe('HeroJobBar', () => {
  beforeEach(() => vi.mocked(fetchStats).mockReset());

  it('shows compact country counts from the stats response', async () => {
    vi.mocked(fetchStats).mockResolvedValue(stats);
    render(
      <MemoryRouter>
        <HeroJobBar />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('status', { name: /loading indicative job counts/i }),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText('Indicative jobs by country')).toBeInTheDocument();
    expect(screen.getByText('1,480')).toBeInTheDocument();
    expect(screen.getByText('Saudi Arabia')).toBeInTheDocument();
    expect(screen.getByText('UAE')).toBeInTheDocument();
    expect(screen.getByTestId('flag-saudi-arabia')).toBeInTheDocument();
    expect(screen.getByTestId('flag-united-arab-emirates')).toBeInTheDocument();
    expect(screen.getAllByText('jobs')).toHaveLength(6);
    for (const { country } of stats.byCountry) {
      const label = country === 'United Arab Emirates' ? 'UAE' : country;
      expect(screen.getByRole('link', { name: new RegExp(label) })).toHaveAttribute(
        'href',
        `/jobs?country=${country.toLowerCase().replaceAll(' ', '-')}`,
      );
    }
    expect(screen.getAllByLabelText(/illustrative (increase|decrease) indicator/i)).toHaveLength(6);
    expect(screen.queryByText(/Indicative figures, updated daily/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Snapshot date:/)).not.toBeInTheDocument();
  });

  it('offers a retry when counts cannot be loaded', async () => {
    vi.mocked(fetchStats).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(stats);
    render(
      <MemoryRouter>
        <HeroJobBar />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(/temporarily unavailable/i);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    await waitFor(() => expect(fetchStats).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('1,480')).toBeInTheDocument();
  });
});
