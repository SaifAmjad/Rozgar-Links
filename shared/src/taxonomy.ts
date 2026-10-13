import rawJobTaxonomy from '../jobTaxonomy.json' with { type: 'json' };

import { jobTaxonomySchema } from './schemas/taxonomy.js';

export const jobTaxonomy = jobTaxonomySchema.parse(rawJobTaxonomy);

export const jobFieldsById = new Map(jobTaxonomy.fields.map((field) => [field.id, field]));
