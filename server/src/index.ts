import { createApp } from './app.js';
import { env } from './config/env.js';
import { startStatsCron } from './jobs/statsCron.js';
import { statsService } from './services/statsRuntime.js';

const app = createApp();

await startStatsCron({
  expression: env.STATS_CRON,
  service: statsService,
  timeZone: env.TZ,
});

app.listen(env.PORT, () => {
  console.log(`Rozgar Links API listening on port ${env.PORT}.`);
});
