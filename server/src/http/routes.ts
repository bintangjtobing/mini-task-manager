import { Router } from 'express';
import type { TaskService } from '../services/taskService';
import { TASK_STATUSES } from '../domain/status';
import { ACTORS } from '../domain/actors';
import { createTaskController } from './taskController';

export function createRouter(service: TaskService): Router {
  const router = Router();
  const tasks = createTaskController(service);

  router.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Single source of truth for the frontend dropdowns / labels.
  router.get('/meta', (_req, res) => res.json({ statuses: TASK_STATUSES, actors: ACTORS }));

  router.get('/tasks', tasks.list);
  router.post('/tasks', tasks.create);
  router.patch('/tasks/:id/status', tasks.updateStatus);
  router.delete('/tasks/:id', tasks.remove);
  router.get('/tasks/:id/audit-logs', tasks.auditLogs);

  return router;
}
