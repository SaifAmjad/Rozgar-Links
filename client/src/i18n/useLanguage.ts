import { createContext, useContext } from 'react';

import { translate, type Language } from './translations';

export interface LanguageContextValue {
  direction: 'ltr' | 'rtl';
  hasChosenLanguage: boolean;
  language: Language;
  setLanguage: (language: Language) => void;
  t: (message: string, values?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextValue>({
  direction: 'ltr',
  hasChosenLanguage: true,
  language: 'en',
  setLanguage: () => undefined,
  t: (message, values) => translate('en', message, values),
});

export function useLanguage() {
  return useContext(LanguageContext);
}
