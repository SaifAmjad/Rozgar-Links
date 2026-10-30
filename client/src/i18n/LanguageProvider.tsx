import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { languageStorageKey, translate, type Language } from './translations';
import { LanguageContext, type LanguageContextValue } from './useLanguage';

function readStoredLanguage(): Language | undefined {
  try {
    const stored = window.localStorage.getItem(languageStorageKey);
    return stored === 'en' || stored === 'ur' ? stored : undefined;
  } catch {
    return undefined;
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [storedLanguage, setStoredLanguage] = useState<Language | undefined>(readStoredLanguage);
  const language = storedLanguage ?? 'en';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      direction: language === 'ur' ? 'rtl' : 'ltr',
      hasChosenLanguage: storedLanguage !== undefined,
      language,
      setLanguage(nextLanguage) {
        try {
          window.localStorage.setItem(languageStorageKey, nextLanguage);
        } catch {
          setStoredLanguage(nextLanguage);
          return;
        }
        setStoredLanguage(nextLanguage);
      },
      t: (message, values) => translate(language, message, values),
    }),
    [language, storedLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
