import { randomUUID } from 'node:crypto';
import type { Database, DbState } from '../persistence/database';
import { evaluateTransition, type TaskStatus } from '../domain/status';
import { InvalidTransitionError, NotFoundError } from '../domain/errors';
import type { AuditAction, AuditLog, Task } from '../domain/types';

const INITIAL_STATUS: TaskStatus = 'to_do';

export interface CreateTaskInput {
  title: string;
  actor: string;
}

export interface UpdateStatusInput {
  status: TaskStatus;
  actor: string;
}

export interface UpdateStatusResult {
  task: Task;
  /** false when the request was an idempotent no-op (no audit log was written). */
  changed: boolean;
}

interface LogDraft {
  taskId: string;
  taskTitle: string;
  action: AuditAction;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus | null;
  actor: string;
  at: string;
}

function appendLog(state: DbState, draft: LogDraft): void {
  // Audit logs are append-only and never removed, so the array length is
  // monotonic and safe to use as the chronological sequence number.
  const seq = state.auditLogs.length + 1;
  const log: AuditLog = { id: randomUUID(), seq, ...draft };
  state.auditLogs.push(log);
}

/**
 * Orchestrates the task lifecycle and guarantees that every state change and
 * its audit record are written together, atomically, inside one transaction.
 */
export class TaskService {
  constructor(private readonly db: Database) {}

  async list(): Promise<Task[]> {
    const state = await this.db.read();
    return [...state.tasks].sort(
      (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );
  }

  async create(input: CreateTaskInput): Promise<Task> {
    return this.db.transaction((state) => {
      const now = new Date().toISOString();
      const task: Task = {
        id: randomUUID(),
        title: input.title,
        status: INITIAL_STATUS,
        ownerId: input.actor,
        createdAt: now,
        updatedAt: now,
      };
      state.tasks.push(task);
      appendLog(state, {
        taskId: task.id,
        taskTitle: task.title,
        action: 'created',
        fromStatus: null,
        toStatus: INITIAL_STATUS,
        actor: input.actor,
        at: now,
      });
      return structuredClone(task);
    });
  }

  async updateStatus(id: string, input: UpdateStatusInput): Promise<UpdateStatusResult> {
    return this.db.transaction((state) => {
      const task = state.tasks.find((candidate) => candidate.id === id);
      if (!task) {
        throw new NotFoundError(`Task "${id}" was not found.`);
      }

      const transition = evaluateTransition(task.status, input.status);

      if (transition.kind === 'invalid') {
        throw new InvalidTransitionError(transition.reason);
      }

      if (transition.kind === 'noop') {
        // Idempotent: same status in -> no change, no audit log.
        return { task: structuredClone(task), changed: false };
      }

      const now = new Date().toISOString();
      const from = task.status;
      task.status = transition.to;
      task.updatedAt = now;
      appendLog(state, {
        taskId: task.id,
        taskTitle: task.title,
        action: 'status_changed',
        fromStatus: from,
        toStatus: transition.to,
        actor: input.actor,
        at: now,
      });
      return { task: structuredClone(task), changed: true };
    });
  }

  async remove(id: string, actor: string): Promise<void> {
    await this.db.transaction((state) => {
      const index = state.tasks.findIndex((candidate) => candidate.id === id);
      if (index === -1) {
        throw new NotFoundError(`Task "${id}" was not found.`);
      }
      const task = state.tasks[index];
      const now = new Date().toISOString();
      // Record the deletion BEFORE removing the task; the audit trail is preserved.
      appendLog(state, {
        taskId: task.id,
        taskTitle: task.title,
        action: 'deleted',
        fromStatus: task.status,
        toStatus: null,
        actor,
        at: now,
      });
      state.tasks.splice(index, 1);
    });
  }

  /** Audit logs for a task, oldest first. Returned even after the task is deleted. */
  async auditLogs(taskId: string): Promise<AuditLog[]> {
    const state = await this.db.read();
    return state.auditLogs.filter((log) => log.taskId === taskId).sort((a, b) => a.seq - b.seq);
  }
}
