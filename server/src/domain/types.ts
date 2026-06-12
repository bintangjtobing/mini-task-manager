import type { TaskStatus } from './status';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  /** Id of the user who created (and therefore owns) the task. */
  ownerId: string;
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

export type AuditAction = 'created' | 'status_changed' | 'deleted';

/**
 * An immutable audit record. Entries are append-only: once written they are
 * never updated or deleted (there is no API or service method to do so).
 */
export interface AuditLog {
  id: string;
  /** Monotonic insertion order — the source of truth for chronological sorting. */
  seq: number;
  taskId: string;
  /** Snapshot of the title, so the log stays readable even after the task is deleted. */
  taskTitle: string;
  action: AuditAction;
  /** null when action = 'created'. */
  fromStatus: TaskStatus | null;
  /** null when action = 'deleted'. */
  toStatus: TaskStatus | null;
  /** Id of the predefined user who performed the action. */
  actor: string;
  at: string; // ISO-8601
}
