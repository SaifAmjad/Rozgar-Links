import type { ErrorRequestHandler, RequestHandler } from 'express';

import { HttpError } from '../errors/httpError.js';

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    success: false,
    error: { code: 'not_found', message: 'The requested endpoint was not found.' },
  });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  void next;
  const safeError =
    error instanceof HttpError
      ? error
      : new HttpError(500, 'internal_error', 'The request could not be completed.');

  response.status(safeError.status).json({
    success: false,
    error: {
      code: safeError.code,
      message: safeError.message,
      ...(safeError.fieldErrors ? { fieldErrors: safeError.fieldErrors } : {}),
    },
  });
};
