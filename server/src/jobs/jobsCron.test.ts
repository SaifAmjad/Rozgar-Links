import { afterEach, describe, expect, it, vi } from 'vitest';

import type { JobsService } from '../services/jobsService.js';
import { startJobsCron, stopJobsCron } from './jobsCron.js';

afterEach(async () => {
  await stopJobsCron();
});

describe('jobs cron', () => {
  it('initializes once and does not create duplicate scheduled tasks', async () => {
    const getJobs = vi.fn().mockResolvedValue(undefined);
    const service = { getJobs } as unknown as JobsService;
    const options = { service, timeZone: 'Asia/Karachi' };

    const firstTask = await startJobsCron(options);
    const secondTask = await startJobsCron(options);

    expect(secondTask).toBe(firstTask);
    expect(getJobs).toHaveBeenCalledTimes(1);
  });
});
