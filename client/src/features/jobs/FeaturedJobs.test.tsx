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

  it('renders API-provided occupations without presenting them as vacancies', async () => {
    const result: JobsResponse = {
      items: [
        {
          id: 'occupation-011',
          slug: 'house-building-electrician',
          titleEn: 'House / Building Electrician',
          titleUr: 'بلڈنگ الیکٹریشن',
          category: {
            id: 'electrical-mep-solar',
            nameEn: 'Electrical, MEP & Solar Trades',
            nameUr: 'الیکٹریکل، مکینیکل اور سولر ٹیکنیشنز',
            sortOrder: 2,
          },
          salaryMin: 1800,
          salaryMax: 2200,
          salaryMaxOpenEnded: false,
          salaryCurrency: 'SAR',
          salaryPeriod: 'monthly',
          countryIds: [],
          recordType: 'occupation_directory',
          isActive: true,
          sortOrder: 11,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      page: 1,
      limit: 3,
      total: 64,
      totalPages: 22,
      lastUpdated: '2026-10-13T00:00:00.000Z',
      sort: 'directory-order',
      facets: { categories: [], designations: [], salaryBands: [], countries: [] },
      provenance: {
        kind: 'directory',
        source: 'Rozgar Link directory',
        isStale: false,
        notice: 'Indicative directory figures.',
      },
    };
    vi.mocked(fetchJobs).mockResolvedValue(result);

    render(
      <MemoryRouter>
        <FeaturedJobs />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'House / Building Electrician' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/compare indicative monthly salary/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /apply now.*House \/ Building Electrician/i }),
    ).toHaveAttribute('href', '/apply?job=occupation-011');
    expect(fetchJobs).toHaveBeenCalledWith({ limit: 3, page: 1 }, expect.any(AbortSignal));
  });
});
