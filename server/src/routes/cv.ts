import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { HttpError } from '../errors/httpError.js';
import { uploadCvVerification } from '../middleware/upload.js';
import { validateUploadedFile } from '../middleware/fileInspection.js';
import { verifyIssuedCv } from '../services/cvIdentity.js';

export function createCvRouter() {
  const router = Router();
  router.post(
    '/verify',
    rateLimit({
      windowMs: 60 * 60 * 1000,
      limit: 20,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler(_request, response) {
        response
          .status(429)
          .json({
            success: false,
            error: {
              code: 'rate_limited',
              message: 'Too many verification attempts. Please try again later.',
            },
          });
      },
    }),
    uploadCvVerification,
    (request, response, next) => {
      response.setHeader('Cache-Control', 'no-store');
      try {
        if (!request.file || Object.keys(request.body as object).length) {
          throw new HttpError(400, 'invalid_upload', 'Upload one PDF CV only.');
        }
        const file = validateUploadedFile('cv', request.file);
        if (file.mimeType !== 'application/pdf')
          throw new HttpError(400, 'invalid_upload', 'Upload one PDF CV only.');
        const verified = verifyIssuedCv(file.buffer);
        return response.json(
          verified
            ? { valid: true, ...verified }
            : {
                valid: false,
                message: 'This document could not be verified as an official Rozgar Links CV.',
              },
        );
      } catch (error) {
        next(error);
      }
    },
  );
  return router;
}
