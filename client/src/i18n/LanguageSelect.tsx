import { Languages } from 'lucide-react';

import { useLanguage } from './useLanguage';

export function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className={`flex items-center gap-2 ${compact ? '' : 'w-full'}`}>
      <Languages aria-hidden="true" className="shrink-0 text-brand-green" size={18} />
      <span className="sr-only">{t('Language')}</span>
      <select
        aria-label={t('Language')}
        className={`${compact ? 'w-28' : 'w-full'} min-h-11 rounded-xl border bg-bg px-3 py-2 text-sm font-bold text-primary`}
        onChange={(event) => setLanguage(event.target.value as 'en' | 'ur')}
        value={language}
      >
        <option value="en">English</option>
        <option value="ur">اردو</option>
      </select>
    </label>
  );
}
