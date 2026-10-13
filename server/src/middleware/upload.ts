import type { RequestHandler } from 'express';
import multer from 'multer';

import { env } from '../config/env.js';
import { HttpError } from '../errors/httpError.js';
import {
  validateUploadedFile,
  type ApplicationFileField,
  type ValidatedApplicationFile,
} from './fileInspection.js';

const maximumFileBytes = env.MAX_FILE_MB * 1024 * 1024;
const maximumRequestBytes = maximumFileBytes * 4 + 100 * 1024;

const claimedMimeTypes: Record<ApplicationFileField, Set<string>> = {
  cv: new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
  passportCopy: new Set(['application/pdf', 'image/jpeg', 'image/png']),
  photo: new Set(['application/pdf', 'image/jpeg', 'image/png']),
  paymentScreenshot: new Set(['image/jpeg', 'image/png']),
};

const uploader = multer({
  storage: multer.memoryStorage(),
  fileFilter(_request, file, callback) {
    const fieldName = file.fieldname as ApplicationFileField;
    if (
      !(fieldName in claimedMimeTypes) ||
      file.originalname.length > 160 ||
      file.originalname.includes('\0') ||
      !claimedMimeTypes[fieldName].has(file.mimetype)
    ) {
      callback(new HttpError(400, 'invalid_upload', 'One or more uploads are not allowed.'));
      return;
    }
    callback(null, true);
  },
  limits: {
    fieldNameSize: 50,
    fieldSize: 50 * 1024,
    fields: 2,
    fileSize: maximumFileBytes,
    files: 4,
    parts: 6,
  },
});

const applicationUpload = uploader.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'paymentScreenshot', maxCount: 1 },
  { name: 'passportCopy', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
]);

export const uploadApplication: RequestHandler = (request, response, next) => {
  const contentLength = Number(request.headers['content-length']);
  if (Number.isFinite(contentLength) && contentLength > maximumRequestBytes) {
    next(new HttpError(413, 'request_too_large', 'The application upload is too large.'));
    return;
  }

  applicationUpload(request, response, (error: unknown) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof HttpError) {
      next(error);
      return;
    }
    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE' || error.code === 'LIMIT_PART_COUNT';
      next(
        new HttpError(
          tooLarge ? 413 : 400,
          tooLarge ? 'request_too_large' : 'invalid_upload',
          tooLarge ? 'The application upload is too large.' : 'The multipart upload is invalid.',
        ),
      );
      return;
    }
    next(new HttpError(400, 'invalid_upload', 'The multipart upload is invalid.'));
  });
};

export type ValidatedApplicationFiles = Record<'cv' | 'paymentScreenshot', ValidatedApplicationFile> &
  Partial<Record<'passportCopy' | 'photo', ValidatedApplicationFile>>;

export function getValidatedApplicationFiles(request: Express.Request): ValidatedApplicationFiles {
  const uploaded = (request.files ?? {}) as Record<string, Express.Multer.File[]>;
  const cv = uploaded.cv?.[0];
  const paymentScreenshot = uploaded.paymentScreenshot?.[0];
  if (!cv || !paymentScreenshot) {
    throw new HttpError(400, 'missing_upload', 'CV and payment screenshot are required.');
  }

  const passportCopy = uploaded.passportCopy?.[0];
  const photo = uploaded.photo?.[0];
  return {
    cv: validateUploadedFile('cv', cv),
    paymentScreenshot: validateUploadedFile('paymentScreenshot', paymentScreenshot),
    ...(passportCopy ? { passportCopy: validateUploadedFile('passportCopy', passportCopy) } : {}),
    ...(photo ? { photo: validateUploadedFile('photo', photo) } : {}),
  };
}

export { maximumFileBytes, maximumRequestBytes };
