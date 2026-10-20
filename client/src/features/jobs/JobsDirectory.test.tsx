import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { JobListing, JobsResponse } from '@rozgar-links/shared';

import { fetchJobs } from './api';
import { JobCard } from './JobCard';
import { JobsDirectory } from './JobsDirectory';

vi.mock('./api', () => ({ fetchJobs: vi.fn() }));

const sampleJob: JobListing = {
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
};

function response(overrides: Partial<JobsResponse> = {}): JobsResponse {
  return {
    items: [sampleJob],
    page: 1,
    limit: 12,
    total: 1,
    totalPages: 1,
    lastUpdated: '2026-10-13T00:00:00.000Z',
    provenance: {
      kind: 'sample',
      source: 'Fictional sample catalog',
      isStale: false,
      notice: 'Fictional sample listings for interface demonstration only.',
    },
    ...overrides,
  };
}

describe('JobsDirectory', () => {
  beforeEach(() => {
    vi.mocked(fetchJobs).mockReset();
  });

  it('renders a curated listing with no fabricated original-source link', async () => {
    vi.mocked(fetchJobs).mockResolvedValue(response());
    render(
      <MemoryRouter>
        <JobsDirectory />
      </MemoryRouter>,
    );

    expect(screen.getByRole('status', { name: /loading jobs/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Site Mason' })).toBeInTheDocument();
    expect(screen.getByText('Job listing')).toBeInTheDocument();
    expect(screen.getAllByText('Rozgar Links').length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /original source/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view application steps/i })).toHaveAttribute(
      'href',
      '/apply?country=Saudi%20Arabia&field=construction&job=sample-001',
    );
  });

  it('submits validated country, field and case-preserving search filters', async () => {
    vi.mocked(fetchJobs).mockResolvedValue(response());
    render(
      <MemoryRouter>
        <JobsDirectory />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { name: 'Site Mason' });

    fireEvent.change(screen.getByLabelText('Search jobs'), { target: { value: 'Mason' } });
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'Saudi Arabia' } });
    fireEvent.change(screen.getByLabelText('Field'), { target: { value: 'construction' } });
    fireEvent.click(screen.getByRole('button', { name: /search listings/i }));

    await waitFor(() => expect(fetchJobs).toHaveBeenCalledTimes(2));
    expect(fetchJobs).toHaveBeenLastCalledWith(
      {
        country: 'Saudi Arabia',
        field: 'construction',
        limit: 12,
        page: 1,
        q: 'Mason',
      },
      expect.any(AbortSignal),
    );
  });

  it('announces stale cache and supports pagination', async () => {
    vi.mocked(fetchJobs)
      .mockResolvedValueOnce(
        response({
          limit: 12,
          total: 13,
          totalPages: 2,
          provenance: { ...response().provenance, isStale: true },
        }),
      )
      .mockResolvedValueOnce(response({ page: 2, total: 13, totalPages: 2 }));
    render(
      <MemoryRouter>
        <JobsDirectory />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/last valid cached catalog shown/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(fetchJobs).toHaveBeenCalledTimes(2));
    expect(fetchJobs).toHaveBeenLastCalledWith({ limit: 12, page: 2 }, expect.any(AbortSignal));
  });

  it('uses safe external-link attributes only for authorized records', () => {
    render(
      <MemoryRouter>
        <JobCard
          job={{
            ...sampleJob,
            id: 'authorized-001',
            isSample: false,
            source: 'Authorized feed',
            sourceUrl: 'https://jobs.example.com/authorized-001',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /original source/i })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    expect(screen.getByRole('link', { name: /original source/i })).toHaveAttribute(
      'target',
      '_blank',
    );
  });
});
