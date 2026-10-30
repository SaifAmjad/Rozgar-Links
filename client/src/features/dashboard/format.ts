import type { Language } from '../../i18n/translations';

function locale(language: Language) {
  return language === 'ur' ? 'ur-PK' : 'en-PK';
}

export function formatCount(value: number, language: Language = 'en') {
  return new Intl.NumberFormat(locale(language)).format(value);
}

export function formatDate(date: string, language: Language = 'en') {
  return new Intl.DateTimeFormat(locale(language), {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00Z`));
}

export function formatUpdatedAt(timestamp: string, language: Language = 'en') {
  return new Intl.DateTimeFormat(locale(language), {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    timeZoneName: 'short',
    year: 'numeric',
  }).format(new Date(timestamp));
}
