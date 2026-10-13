import { ManualProvider } from '../providers/ManualProvider.js';
import { JobsService } from './jobsService.js';

export const jobsService = new JobsService({ provider: new ManualProvider() });
