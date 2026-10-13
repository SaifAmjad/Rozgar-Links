export class HttpError extends Error {
  readonly code: string;
  readonly fieldErrors?: Record<string, string[]> | undefined;
  readonly status: number;

  constructor(
    status: number,
    code: string,
    message: string,
    fieldErrors?: Record<string, string[]> | undefined,
  ) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}
