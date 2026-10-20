import { jobTaxonomy, publicConfigResponseSchema } from '@rozgar-links/shared';
import { Router } from 'express';

import { env } from '../config/env.js';

export function createPublicConfigRouter(
  applicationSubmissionEnabled = env.APPLICATION_SUBMISSION_ENABLED,
) {
  const router = Router();

  router.get('/', (_request, response) => {
    const publicConfig = publicConfigResponseSchema.parse({
      bankAccountTitle: env.BANK_ACCOUNT_TITLE,
      bankName: env.BANK_NAME,
      bankAccountNumber: env.BANK_ACCOUNT_NUMBER,
      bankIban: env.BANK_IBAN,
      serviceFeeAmount: env.SERVICE_FEE_AMOUNT,
      serviceFeeCurrency: env.SERVICE_FEE_CURRENCY,
      taxonomyVersion: jobTaxonomy.version,
      isDemoPayment: env.PAYMENT_DETAILS_ARE_DEMO,
      applicationSubmissionEnabled,
    });

    response.status(200).json(publicConfig);
  });

  return router;
}

export const publicConfigRouter = createPublicConfigRouter();
