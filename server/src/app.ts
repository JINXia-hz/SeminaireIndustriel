import express, { type ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { createTaskSchema } from './domain.ts';
import { DEFAULT_SEED, TaskStore } from './store.ts';

export interface AppOptions {
  store?: TaskStore;
  /** Exposes POST /api/test/reset. Only enabled for end-to-end tests. */
  enableTestRoutes?: boolean;
}

export function createApp({
  store = new TaskStore(DEFAULT_SEED),
  enableTestRoutes = false,
}: AppOptions = {}) {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/tasks', (_req, res) => {
    res.json(store.list());
  });

  app.post('/api/tasks', (req, res) => {
    const input = createTaskSchema.parse(req.body);
    res.status(201).json(store.create(input));
  });

  if (enableTestRoutes) {
    app.post('/api/test/reset', (req, res) => {
      const seed = Array.isArray(req.body?.tasks) ? req.body.tasks : [];
      store.reset(seed);
      res.status(204).end();
    });
  }

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'NotFound' });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'ValidationError', details: err.issues });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'InternalError' });
  };
  app.use(errorHandler);

  return app;
}
