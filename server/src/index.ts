import { createApp } from './app.js';
import { env } from './config/env.js';
import { startJobsCron } from './jobs/jobsCron.js';
import { startStatsCron } from './jobs/statsCron.js';
import { jobsService } from './services/jobsRuntime.js';
import { statsService } from './services/statsRuntime.js';

const app = createApp();

await startStatsCron({
  expression: env.STATS_CRON,
  service: statsService,
  timeZone: env.TZ,
});
await startJobsCron({ service: jobsService, timeZone: env.TZ });

app.listen(env.PORT, () => {
  console.log(`Rozgar Links API listening on port ${env.PORT}.`);
});
