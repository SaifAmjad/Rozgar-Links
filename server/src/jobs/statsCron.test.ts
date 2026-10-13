import { afterEach, describe, expect, it, vi } from 'vitest';

import type { StatsService } from '../services/statsService.js';
import { startStatsCron, stopStatsCron } from './statsCron.js';

afterEach(async () => {
  await stopStatsCron();
});

describe('stats cron', () => {
  it('initializes once and does not create duplicate scheduled tasks', async () => {
    const ensureToday = vi.fn().mockResolvedValue(undefined);
    const service = { ensureToday } as unknown as StatsService;
    const options = {
      expression: '5 0 * * *',
      service,
      timeZone: 'Asia/Karachi',
    };

    const firstTask = await startStatsCron(options);
    const secondTask = await startStatsCron(options);

    expect(secondTask).toBe(firstTask);
    expect(ensureToday).toHaveBeenCalledTimes(1);
  });
});
