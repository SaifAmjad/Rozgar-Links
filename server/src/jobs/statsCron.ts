import { schedule, type ScheduledTask } from 'node-cron';

import type { StatsService } from '../services/statsService.js';

interface StatsCronOptions {
  expression: string;
  service: StatsService;
  timeZone: string;
}

let activeTask: ScheduledTask | undefined;

export async function startStatsCron({ expression, service, timeZone }: StatsCronOptions) {
  if (activeTask) return activeTask;

  try {
    await service.ensureToday();
  } catch {
    console.error(
      'Daily statistics initialization failed; the API will use valid stale data if available.',
    );
  }

  activeTask = schedule(
    expression,
    async () => {
      try {
        await service.ensureToday();
      } catch {
        console.error('Daily statistics refresh failed; the last valid snapshot was preserved.');
      }
    },
    {
      name: 'rozgar-links-daily-stats',
      noOverlap: true,
      timezone: timeZone,
    },
  );

  return activeTask;
}

export async function stopStatsCron() {
  if (!activeTask) return;
  await activeTask.destroy();
  activeTask = undefined;
}
