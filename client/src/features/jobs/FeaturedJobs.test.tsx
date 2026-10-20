import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { JobsResponse } from '@rozgar-links/shared';

import { fetchJobs } from './api';
import { FeaturedJobs } from './FeaturedJobs';

vi.mock('./api', () => ({ fetchJobs: vi.fn() }));

describe('FeaturedJobs', () => {
  beforeEach(() => {
    vi.mocked(fetchJobs).mockReset();
  });

  it('renders only API-provided featured jobs', async () => {
    const result: JobsResponse = {
      items: [
        {
          id: 'sample-001',
          title: 'Site Mason',
          company: 'Example Horizon Works',
          country: 'Saudi Arabia',
          city: 'Riyadh',
          field: 'construction',
          source: 'Sample listing',
          sourceUrl: null,
          isSample: true,
          fetchedAt: '2026-10-13T00:00:00.000Z',
        },
      ],
      page: 1,
      limit: 3,
      total: 40,
      totalPages: 14,
      lastUpdated: '2026-10-13T00:00:00.000Z',
      provenance: {
        kind: 'sample',
        source: 'Fictional sample catalog',
        isStale: false,
        notice: 'Fictional sample listings for interface demonstration only.',
      },
    };
    vi.mocked(fetchJobs).mockResolvedValue(result);

    render(
      <MemoryRouter>
        <FeaturedJobs />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Site Mason' })).toBeInTheDocument();
    expect(screen.getByText(/confirm current role details/i)).toBeInTheDocument();
    expect(fetchJobs).toHaveBeenCalledWith({ limit: 3, page: 1 }, expect.any(AbortSignal));
  });
});
