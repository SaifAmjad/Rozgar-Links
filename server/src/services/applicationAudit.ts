import { env } from '../config/env.js';

export interface ApplicationAuditEvent {
  event: 'application_admin_delivery_accepted' | 'application_request_rejected';
  requestId: string;
  status: number;
  timestamp: string;
}

export type ApplicationAuditLogger = (event: ApplicationAuditEvent) => void;

export const writeApplicationAuditEvent: ApplicationAuditLogger = (event) => {
  if (env.NODE_ENV !== 'test') process.stdout.write(`${JSON.stringify(event)}\n`);
};
