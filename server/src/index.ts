import { createApp } from './app.js';
import { env } from './config/env.js';
import { startJobsCron, stopJobsCron } from './jobs/jobsCron.js';
import { startStatsCron, stopStatsCron } from './jobs/statsCron.js';
import { jobsService } from './services/jobsRuntime.js';
import { statsService } from './services/statsRuntime.js';

const app = createApp();

await startStatsCron({
  expression: env.STATS_CRON,
  service: statsService,
  timeZone: env.TZ,
});
await startJobsCron({ service: jobsService, timeZone: env.TZ });

const server = app.listen(env.PORT, () => {
  console.log(`Rozgar Links API listening on port ${env.PORT}.`);
});

let isShuttingDown = false;

async function shutDown(signal: NodeJS.Signals) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Rozgar Links API received ${signal}; shutting down.`);

  await Promise.allSettled([stopStatsCron(), stopJobsCron()]);
  server.close((error) => {
    if (error) {
      console.error('Rozgar Links API shutdown failed.');
      process.exitCode = 1;
    }
  });
}

process.once('SIGINT', () => void shutDown('SIGINT'));
process.once('SIGTERM', () => void shutDown('SIGTERM'));
