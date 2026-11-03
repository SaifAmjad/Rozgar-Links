import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { HowItWorksDialog } from './HowItWorksDialog';
import { LanguageProvider } from '../../i18n/LanguageProvider';
import { languageStorageKey, translate } from '../../i18n/translations';

function LocationProbe() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}

describe('HowItWorksDialog', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('opens a guided step slider and links to the application', () => {
    render(
      <MemoryRouter>
        <HowItWorksDialog />
        <LocationProbe />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'How it works' }));

    expect(screen.getByRole('dialog', { name: 'How Rozgar Links works' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Find a Job' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('group', { name: 'Guide steps' })).getAllByRole('button'),
    ).toHaveLength(3);
    expect(screen.getByText(/Browse job categories/)).toHaveTextContent(/up to 3 jobs/);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'Fill Out Your Application' })).toBeInTheDocument();
    expect(screen.getByText(/Enter your details, choose countries/)).toHaveTextContent(
      /once verified/,
    );
    expect(screen.getByText(/Enter your details, choose countries/)).toHaveTextContent(/Rs. 250/);
    expect(screen.getByText(/Enter your details, choose countries/)).toHaveTextContent(
      /manual review/,
    );
    expect(screen.getByText(/Enter your details, choose countries/)).toHaveTextContent(
      /does not guarantee a job/,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'Submit & Get Contacted' })).toBeInTheDocument();
    expect(screen.getByText(/Review your details and submit/)).toHaveTextContent(
      /phone or WhatsApp/,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Apply Now' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/apply');
  });

  it('shows all three updated steps in Urdu and preserves final navigation', () => {
    window.localStorage.setItem(languageStorageKey, 'ur');
    const t = (message: string) => translate('ur', message);
    render(
      <LanguageProvider>
        <MemoryRouter>
          <HowItWorksDialog />
          <LocationProbe />
        </MemoryRouter>
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: t('How it works') }));
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('heading', { name: t('Find a Job') })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: t('Next') }));
    expect(
      screen.getByRole('heading', { name: t('Fill Out Your Application') }),
    ).toBeInTheDocument();
    const feeText = screen.getByText(/250/);
    expect(feeText).toHaveTextContent('تصدیق');
    expect(feeText).toHaveTextContent('ضمانت نہیں');
    expect(feeText).not.toHaveTextContent('Enter your details');
    fireEvent.click(screen.getByRole('button', { name: t('Next') }));
    expect(screen.getByRole('heading', { name: t('Submit & Get Contacted') })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: t('Apply Now') }));
    expect(screen.getByTestId('location')).toHaveTextContent('/apply');
  });

  it('closes with Escape and returns focus to the trigger', () => {
    render(
      <MemoryRouter>
        <HowItWorksDialog />
      </MemoryRouter>,
    );

    const trigger = screen.getByRole('button', { name: 'How it works' });
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
