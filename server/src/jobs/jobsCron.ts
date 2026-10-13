import { schedule, type ScheduledTask } from 'node-cron';

import type { JobsService } from '../services/jobsService.js';

interface JobsCronOptions {
  expression?: string;
  service: JobsService;
  timeZone: string;
}

let activeTask: ScheduledTask | undefined;

export async function startJobsCron({
  expression = '15 0 * * *',
  service,
  timeZone,
}: JobsCronOptions) {
  if (activeTask) return activeTask;

  try {
    await service.getJobs({ page: 1, limit: 1 });
  } catch {
    console.error(
      'Job catalog initialization failed; a valid stale cache will be used if available.',
    );
  }

  activeTask = schedule(
    expression,
    async () => {
      try {
        await service.refresh();
      } catch {
        console.error('Job catalog refresh failed; the last valid cache was preserved.');
      }
    },
    {
      name: 'rozgar-links-daily-jobs',
      noOverlap: true,
      timezone: timeZone,
    },
  );

  return activeTask;
}

export async function stopJobsCron() {
  if (!activeTask) return;
  await activeTask.destroy();
  activeTask = undefined;
}
