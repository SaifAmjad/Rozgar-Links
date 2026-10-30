import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { HowItWorksDialog } from './HowItWorksDialog';

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
    expect(screen.getByRole('heading', { name: 'Choose work' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'Prepare details' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'Check and finish' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start application' }));
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
