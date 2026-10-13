import { env } from '../config/env.js';
import { StatsService } from './statsService.js';

export const statsService = new StatsService({ timeZone: env.TZ });
