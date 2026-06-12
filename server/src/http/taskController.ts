import type { NextFunction, Request, Response } from 'express';
import type { TaskService } from '../services/taskService';
import type { AuditLog } from '../domain/types';
import { ACTORS } from '../domain/actors';
import { createTaskSchema, deleteTaskSchema, updateStatusSchema } from './validators';

/** Maps an actor id to its display name (falls back to the id if unknown). */
const ACTOR_NAME = new Map<string, string>(ACTORS.map((actor) => [actor.id, actor.name]));

function actorName(id: string): string {
  return ACTOR_NAME.get(id) ?? id;
}

/**
 * Builds the human-readable sentence for an audit entry.
 * The timestamp is intentionally left out here: it is rendered separately by
 * the client, formatted in the viewer's own locale and timezone.
 */
function describe(log: AuditLog): string {
  switch (log.action) {
    case 'created':
      return `User "${log.actor}" created task "${log.taskTitle}" with status "${log.toStatus}"`;
    case 'status_changed':
      return `User "${log.actor}" changed task "${log.taskTitle}" status from "${log.fromStatus}" to "${log.toStatus}"`;
    case 'deleted':
      return `User "${log.actor}" deleted task "${log.taskTitle}" (was "${log.fromStatus}")`;
  }
}

export function createTaskController(service: TaskService) {
  return {
    async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const tasks = await service.list();
        res.json(tasks.map((task) => ({ ...task, ownerName: actorName(task.ownerId) })));
      } catch (err) {
        next(err);
      }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = createTaskSchema.parse(req.body);
        const task = await service.create(body);
        res.status(201).json(task);
      } catch (err) {
        next(err);
      }
    },

    async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = updateStatusSchema.parse(req.body);
        const result = await service.updateStatus(req.params.id, body);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },

    async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = deleteTaskSchema.parse(req.body);
        await service.remove(req.params.id, body.actor);
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    },

    async auditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const logs = await service.auditLogs(req.params.id);
        res.json(
          logs.map((log) => ({ ...log, actorName: actorName(log.actor), message: describe(log) })),
        );
      } catch (err) {
        next(err);
      }
    },
  };
}
