import type { TaskStatus } from './types';

/** Mirrors the strict linear workflow enforced by the backend. */
export const STATUS_ORDER: TaskStatus[] = ['to_do', 'pending', 'in_progress', 'done'];

/** Sentinel value for the "view everyone's tasks" option in the user picker. */
export const ALL_USERS = '__all__';

export const STATUS_LABEL: Record<TaskStatus, string> = {
  to_do: 'To do',
  pending: 'Pending',
  in_progress: 'In progress',
  done: 'Done',
};

export const STATUS_COLOR: Record<TaskStatus, string> = {
  to_do: '#64748b',
  pending: '#d97706',
  in_progress: '#2563eb',
  done: '#16a34a',
};

/** The single status a task may advance to (null = already at the final step). */
export function nextStatus(current: TaskStatus): TaskStatus | null {
  const index = STATUS_ORDER.indexOf(current);
  return index >= 0 && index < STATUS_ORDER.length - 1 ? STATUS_ORDER[index + 1] : null;
}
