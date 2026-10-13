import {
  gccCountryNames,
  jobTaxonomy,
  statsResponseSchema,
  type StatsResponse,
  type StatsTrendEntry,
} from '@rozgar-links/shared';

const DAY_IN_MS = 86_400_000;
const TOTAL_BASELINE = 1_480;

const countryWeights = [0.34, 0.25, 0.09, 0.12, 0.11, 0.09] as const;
const fieldWeights = [0.15, 0.09, 0.1, 0.12, 0.1, 0.1, 0.08, 0.09, 0.05, 0.06, 0.03, 0.03] as const;

function hashSeed(value: string) {
  let hash = 2_166_136_261;

  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
}

function createPrng(seed: number) {
  let state = seed;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function dateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    month: Number(values.month),
    second: Number(values.second),
    year: Number(values.year),
  };
}

export function getDateInTimeZone(now: Date, timeZone: string) {
  const { day, month, year } = dateParts(now, timeZone);
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day
    .toString()
    .padStart(2, '0')}`;
}

function localDateTimeToIso(date: string, timeZone: string, hour: number, minute: number) {
  const [year, month, day] = date.split('-').map(Number);

  if (year === undefined || month === undefined || day === undefined) {
    throw new Error('Invalid ISO date.');
  }

  const target = Date.UTC(year, month - 1, day, hour, minute, 0);
  let guess = target;

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const observed = dateParts(new Date(guess), timeZone);
    const observedAsUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      observed.second,
    );
    guess += target - observedAsUtc;
  }

  return new Date(guess).toISOString();
}

export function addIsoDays(date: string, amount: number) {
  const parsed = new Date(`${date}T12:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid ISO date.');
  }

  return new Date(parsed.getTime() + amount * DAY_IN_MS).toISOString().slice(0, 10);
}

function getDailyTotal(date: string) {
  const random = createPrng(hashSeed(`total:${date}`));
  const dayNumber = Math.floor(new Date(`${date}T12:00:00.000Z`).getTime() / DAY_IN_MS);
  const direction = dayNumber % 2 === 0 ? 1 : -1;
  const variation = 0.0275 + random() * 0.0275;
  return Math.round(TOTAL_BASELINE * (1 + direction * variation));
}

function allocateTotal(
  total: number,
  entries: readonly { label: string; weight: number }[],
  seedKey: string,
) {
  const random = createPrng(hashSeed(seedKey));
  const weightedEntries = entries.map((entry) => ({
    ...entry,
    adjustedWeight: entry.weight * (0.94 + random() * 0.12),
  }));
  const weightTotal = weightedEntries.reduce((sum, entry) => sum + entry.adjustedWeight, 0);
  const allocations = weightedEntries.map((entry) => {
    const exact = (total * entry.adjustedWeight) / weightTotal;
    return {
      count: Math.floor(exact),
      label: entry.label,
      remainder: exact - Math.floor(exact),
    };
  });
  let remaining = total - allocations.reduce((sum, entry) => sum + entry.count, 0);

  for (const entry of [...allocations].sort((left, right) => right.remainder - left.remainder)) {
    if (remaining === 0) break;
    entry.count += 1;
    remaining -= 1;
  }

  return allocations.map(({ count, label }) => ({ count, label }));
}

export function generateStatsHistory(endDate: string, days: number): StatsTrendEntry[] {
  return Array.from({ length: days }, (_, index) => {
    const date = addIsoDays(endDate, index - days + 1);
    return { date, totalOpenings: getDailyTotal(date) };
  });
}

export function generateStatsSnapshot(date: string, timeZone: string): StatsResponse {
  const totalOpenings = getDailyTotal(date);
  const countryEntries = gccCountryNames.map((country, index) => ({
    label: country,
    weight: countryWeights[index]!,
  }));
  const taxonomyFields = jobTaxonomy.fields.map((field, index) => ({
    label: field.label,
    weight: fieldWeights[index]!,
  }));
  const byCountry = allocateTotal(totalOpenings, countryEntries, `country:${date}`).map(
    ({ count, label }) => ({ country: label, count }),
  );
  const byField = allocateTotal(totalOpenings, taxonomyFields, `field:${date}`).map(
    ({ count, label }) => ({ field: label, count }),
  );
  const newTodayRandom = createPrng(hashSeed(`new:${date}`));

  return statsResponseSchema.parse({
    date,
    totalOpenings,
    byCountry,
    byField,
    newToday: Math.round(totalOpenings * (0.04 + newTodayRandom() * 0.05)),
    last7Days: generateStatsHistory(date, 7),
    lastUpdated: localDateTimeToIso(date, timeZone, 0, 5),
    provenance: 'estimated',
    isStale: false,
  });
}
