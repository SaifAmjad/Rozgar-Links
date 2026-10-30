import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { LanguagePrompt } from './LanguagePrompt';
import { LanguageProvider } from './LanguageProvider';
import { LanguageSelect } from './LanguageSelect';
import { languageStorageKey } from './translations';
import { useLanguage } from './useLanguage';

function LanguageProbe() {
  const { t } = useLanguage();
  return <p>{t('Find jobs')}</p>;
}

describe('language selection', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('asks on the first visit and applies Urdu with RTL direction', () => {
    render(
      <LanguageProvider>
        <LanguageProbe />
        <LanguagePrompt />
      </LanguageProvider>,
    );

    expect(screen.getByRole('dialog', { name: /select your language/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'اردو' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('ملازمتیں تلاش کریں')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'ur');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(window.localStorage.getItem(languageStorageKey)).toBe('ur');
  });

  it('restores a saved choice without showing the prompt', () => {
    window.localStorage.setItem(languageStorageKey, 'ur');

    render(
      <LanguageProvider>
        <LanguageProbe />
        <LanguagePrompt />
      </LanguageProvider>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('ملازمتیں تلاش کریں')).toBeInTheDocument();
  });

  it('changes the saved language from the navigation selector', () => {
    window.localStorage.setItem(languageStorageKey, 'en');

    render(
      <LanguageProvider>
        <LanguageSelect />
      </LanguageProvider>,
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), {
      target: { value: 'ur' },
    });

    expect(document.documentElement).toHaveAttribute('lang', 'ur');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(window.localStorage.getItem(languageStorageKey)).toBe('ur');
  });
});
