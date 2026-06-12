/**
 * Shared API contract types. These mirror the backend domain types in
 * `server/src/domain`. In a larger system they would live in a shared package
 * imported by both sides (see the "what I'd improve" section of the README).
 */

export const TASK_STATUSES = ['to_do', 'pending', 'in_progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  ownerId: string;
  /** Display name for `ownerId`, resolved by the API. */
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

export type AuditAction = 'created' | 'status_changed' | 'deleted';

export interface AuditLog {
  id: string;
  seq: number;
  taskId: string;
  taskTitle: string;
  action: AuditAction;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus | null;
  actor: string;
  /** Display name for `actor`, resolved by the API. */
  actorName: string;
  at: string;
  /** Human-readable sentence computed by the API. */
  message: string;
}

export interface Actor {
  id: string;
  name: string;
}

export interface Meta {
  statuses: TaskStatus[];
  actors: Actor[];
}
