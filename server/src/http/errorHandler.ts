import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { DomainError, InvalidTransitionError, NotFoundError, ValidationError } from '../domain/errors';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
}

/**
 * Central error middleware. Maps known error types to HTTP status codes so
 * controllers can stay thin and simply `throw`/`next(err)`.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message } });
    return;
  }

  if (err instanceof InvalidTransitionError) {
    res.status(409).json({ error: { code: 'INVALID_TRANSITION', message: err.message } });
    return;
  }

  if (err instanceof ValidationError) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message, details: err.details } });
    return;
  }

  if (err instanceof DomainError) {
    res.status(400).json({ error: { code: 'DOMAIN_ERROR', message: err.message } });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } });
}
