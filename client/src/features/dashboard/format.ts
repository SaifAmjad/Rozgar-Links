export function formatCount(value: number) {
  return new Intl.NumberFormat().format(value);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00Z`));
}

export function formatUpdatedAt(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    timeZoneName: 'short',
    year: 'numeric',
  }).format(new Date(timestamp));
}
