import multer from 'multer';
import type { RequestHandler } from 'express';
import { HttpError } from '../errors/httpError.js';

export function adminPdfUpload(maximumBytes: number): RequestHandler {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maximumBytes, files: 1, fields: 0, parts: 2, fieldNameSize: 20 },
    fileFilter(_request, file, done) {
      if (
        file.mimetype !== 'application/pdf' ||
        !/\.pdf$/i.test(file.originalname) ||
        file.originalname.length > 160 ||
        file.originalname.includes('\0')
      ) {
        done(new HttpError(400, 'invalid_upload', 'Upload one completed PDF CV only.'));
      } else done(null, true);
    },
  }).single('cv');
  return (request, response, next) => {
    if (Number(request.headers['content-length']) > maximumBytes + 64 * 1024) {
      next(new HttpError(413, 'request_too_large', 'The PDF upload is too large.'));
      return;
    }
    upload(request, response, (error: unknown) => {
      if (!error || error instanceof HttpError) {
        next(error);
        return;
      }
      const oversized = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE';
      next(
        new HttpError(
          oversized ? 413 : 400,
          oversized ? 'request_too_large' : 'invalid_upload',
          oversized ? 'The PDF upload is too large.' : 'Upload one PDF with no additional fields.',
        ),
      );
    });
  };
}
