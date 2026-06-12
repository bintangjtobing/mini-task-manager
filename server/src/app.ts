import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { TaskService } from './services/taskService';
import { createRouter } from './http/routes';
import { errorHandler, notFoundHandler } from './http/errorHandler';
import { CLIENT_URL } from './config';

export function createApp(service: TaskService): Express {
  const app = express();

  // Sits behind the nginx reverse proxy: trust exactly one hop so the
  // rate-limiter keys on the real client IP (X-Forwarded-For) and not nginx.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Security response headers. This service only ever returns JSON, so the
  // default helmet set is appropriate; the SPA's CSP is handled at nginx.
  app.use(helmet());

  // Lock cross-origin browser access to the known frontend origin only.
  app.use(cors({ origin: CLIENT_URL }));

  // Bodies are tiny (title is capped at 200 chars) — reject anything larger
  // early to shrink the attack surface for oversized-payload abuse.
  app.use(express.json({ limit: '16kb' }));

  // Abuse protection. A generous global cap stops floods; mutations get a
  // tighter cap since they grow the persisted data file.
  const generalLimiter = rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });
  const writeLimiter = rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

  app.use('/api', generalLimiter);
  // Apply the stricter limit to state-changing methods only (POST/PATCH/DELETE).
  app.use('/api/tasks', (req: Request, res: Response, next: NextFunction) =>
    req.method === 'GET' ? next() : writeLimiter(req, res, next),
  );

  app.use('/api', createRouter(service));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
