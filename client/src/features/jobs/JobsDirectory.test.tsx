import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { JobsResponse, OccupationListing } from '@rozgar-links/shared';

import { fetchJobs } from './api';
import { JobsDirectory } from './JobsDirectory';

vi.mock('./api', () => ({ fetchJobs: vi.fn() }));

export const occupation: OccupationListing = {
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
};

const categoryNames = [
  'Construction',
  'Electrical',
  'Transport',
  'Hospitality',
  'Retail',
  'Office',
  'Engineering',
  'Healthcare',
  'Information Technology',
];

export function directoryResponse(overrides: Partial<JobsResponse> = {}): JobsResponse {
  return {
    items: [occupation],
    page: 1,
    limit: 12,
    total: 1,
    totalPages: 1,
    lastUpdated: '2026-10-13T00:00:00.000Z',
    sort: 'directory-order',
    facets: {
      categories: categoryNames.map((name, index) => ({
        id: `category-${index + 1}`,
        nameEn: name,
        nameUr: `زمرہ ${index + 1}`,
        sortOrder: index + 1,
        count: index === 1 ? 10 : 0,
      })),
      designations: Array.from({ length: 64 }, (_, index) => ({
        slug: index === 0 ? occupation.slug : `occupation-${index + 1}`,
        titleEn: index === 0 ? occupation.titleEn : `Occupation ${index + 1}`,
        titleUr: index === 0 ? occupation.titleUr : `پیشہ ${index + 1}`,
        categoryId: index === 0 ? occupation.category.id : 'category-1',
      })),
      salaryBands: [
        { id: 'sar-1400-1600', minimum: 1400, maximum: 1600, count: 6 },
        { id: 'sar-1601-2200', minimum: 1601, maximum: 2200, count: 25 },
        { id: 'sar-2201-3000', minimum: 2201, maximum: 3000, count: 17 },
        { id: 'sar-3001-plus', minimum: 3001, maximum: null, count: 16 },
      ],
      countries: [
        {
          id: 'saudi-arabia',
          nameEn: 'Saudi Arabia',
          nameUr: 'سعودی عرب',
          enabled: false,
          count: 0,
        },
        {
          id: 'united-arab-emirates',
          nameEn: 'United Arab Emirates',
          nameUr: 'متحدہ عرب امارات',
          enabled: false,
          count: 0,
        },
        { id: 'qatar', nameEn: 'Qatar', nameUr: 'قطر', enabled: false, count: 0 },
        { id: 'kuwait', nameEn: 'Kuwait', nameUr: 'کویت', enabled: false, count: 0 },
        { id: 'oman', nameEn: 'Oman', nameUr: 'عمان', enabled: false, count: 0 },
      ],
    },
    provenance: {
      kind: 'directory',
      source: 'Rozgar Link directory',
      isStale: false,
      notice:
        'Salary ranges are indicative monthly directory figures in SAR, not guaranteed employer offers or verified vacancies.',
    },
    ...overrides,
  };
}

describe('JobsDirectory', () => {
  beforeEach(() => {
    vi.mocked(fetchJobs).mockReset();
    vi.mocked(fetchJobs).mockResolvedValue(directoryResponse());
  });

  it('renders salary and category data without an application action', async () => {
    render(
      <MemoryRouter>
        <JobsDirectory />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: occupation.titleEn })).toBeInTheDocument();
    expect(screen.getByText(/SAR 1,800 – 2,200/)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Categories' })).toHaveValue('');
    expect(screen.getByRole('option', { name: 'All categories (64)' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Monthly salary' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Designation' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Country' })).toBeDisabled();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /apply/i })).not.toBeInTheDocument();
    expect(screen.getByText(/country filtering will be enabled/i)).toBeInTheDocument();
  });

  it('loads URL-backed filters and updates salary selection', async () => {
    render(
      <MemoryRouter initialEntries={['/jobs?q=Electrician&salary=sar-1601-2200']}>
        <JobsDirectory />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: occupation.titleEn });
    expect(fetchJobs).toHaveBeenCalledWith(
      expect.objectContaining({
        q: 'Electrician',
        salary: ['sar-1601-2200'],
      }),
      expect.any(AbortSignal),
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Monthly salary' }), {
      target: { value: 'sar-1400-1600' },
    });
    await waitFor(() =>
      expect(fetchJobs).toHaveBeenLastCalledWith(
        expect.objectContaining({
          salary: ['sar-1400-1600'],
        }),
        expect.any(AbortSignal),
      ),
    );
  });

  it('shows a useful reset action for empty results', async () => {
    vi.mocked(fetchJobs).mockResolvedValue(
      directoryResponse({ items: [], total: 0, totalPages: 0 }),
    );
    render(
      <MemoryRouter>
        <JobsDirectory />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'No matching occupations found' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear all filters' })).toBeInTheDocument();
  });
});
