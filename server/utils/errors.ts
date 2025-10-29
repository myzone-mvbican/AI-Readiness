/**
 * Typed error classes for better error handling
 * Following the code quality guidelines for structured error handling
 */

export class ValidationError extends Error {
  public readonly code = 'VALIDATION_ERROR';
  public readonly status = 400;
  public readonly details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class NotFoundError extends Error {
  public readonly code = 'NOT_FOUND';
  public readonly status = 404;

  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  public readonly code = 'CONFLICT';
  public readonly status = 409;

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends Error {
  public readonly code = 'UNAUTHORIZED';
  public readonly status = 401;

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  public readonly code = 'FORBIDDEN';
  public readonly status = 403;

  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class InternalServerError extends Error {
  public readonly code = 'INTERNAL_SERVER_ERROR';
  public readonly status = 500;

  constructor(message: string = 'Internal server error') {
    super(message);
    this.name = 'InternalServerError';
  }
}

export class BadRequestError extends Error {
  public readonly code = 'BAD_REQUEST';
  public readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}
