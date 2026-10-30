import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App router', () => {
  it('renders the home page', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /find your next gulf opportunity/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /find jobs/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Rozgar Links')).toHaveLength(2);
    expect(screen.getByText(/employment is not guaranteed/i)).toBeInTheDocument();
  });

  it.each([
    ['/jobs', 'Find the right occupation'],
    ['/apply', 'Application form'],
    ['/success', 'Submission receipt unavailable'],
    ['/faq', 'Frequently asked questions'],
    ['/contact', 'Contact Rozgar Links'],
    ['/privacy', 'Privacy notice'],
    ['/terms', 'Terms of service'],
    ['/fees-and-refunds', 'Fees and refunds'],
  ])('renders the %s route', (route, heading) => {
    render(
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('renders the independent-service disclaimer and legal navigation', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText(/not affiliated with or endorsed by gulftalent/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByText(/recruitment licence: pending-verification/i)).toBeInTheDocument();
  });

  it('shows only a contract-valid submission receipt and confirmation status', () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/success',
            state: {
              success: true,
              referenceId: 'RL-2026-ABC234',
            },
          },
        ]}
      >
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Application submitted' })).toBeInTheDocument();
    expect(screen.getByText('RL-2026-ABC234')).toBeInTheDocument();
    expect(screen.getByText(/does not verify payment/i)).toBeInTheDocument();
  });

  it('opens and closes the mobile menu with the keyboard', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    const openButton = screen.getByRole('button', { name: 'Open navigation menu' });
    expect(openButton).toHaveAttribute('aria-expanded', 'false');
    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary navigation' });
    expect(within(primaryNavigation).queryByRole('link', { name: 'FAQ' })).not.toBeInTheDocument();
    expect(
      within(primaryNavigation).queryByRole('link', { name: 'Contact' }),
    ).not.toBeInTheDocument();

    fireEvent.click(openButton);
    const closeButton = screen.getByRole('button', { name: 'Close navigation menu' });
    expect(closeButton).toHaveAttribute('aria-expanded', 'true');
    const mobileNavigation = screen.getByRole('navigation', { name: 'Mobile navigation' });
    expect(mobileNavigation).toBeInTheDocument();
    expect(within(mobileNavigation).queryByRole('link', { name: 'FAQ' })).not.toBeInTheDocument();
    expect(
      within(mobileNavigation).queryByRole('link', { name: 'Contact' }),
    ).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveFocus();
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument();
  });

  it('renders an accessible fallback for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/missing']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '/');
  });
});
