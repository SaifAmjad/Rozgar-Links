import { jobTaxonomy } from '@rozgar-links/shared';
import { Router } from 'express';

export const taxonomyRouter = Router();

taxonomyRouter.get('/', (_request, response) => {
  response.status(200).json(jobTaxonomy);
});
