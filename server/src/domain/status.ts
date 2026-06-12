/**
 * The fixed, ordered set of task statuses.
 * The workflow is a strict linear pipeline; a task may only advance one step
 * at a time and can never move backwards or skip a step.
 */
export const TASK_STATUSES = ['to_do', 'pending', 'in_progress', 'done'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

const ORDER: readonly TaskStatus[] = TASK_STATUSES;

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && (TASK_STATUSES as readonly string[]).includes(value);
}

/** The only status a task in `current` may transition to (null = terminal). */
export function nextStatus(current: TaskStatus): TaskStatus | null {
  const index = ORDER.indexOf(current);
  return index >= 0 && index < ORDER.length - 1 ? ORDER[index + 1] : null;
}

export type TransitionResult =
  | { kind: 'noop' }
  | { kind: 'valid'; from: TaskStatus; to: TaskStatus }
  | { kind: 'invalid'; reason: string };

/**
 * Pure decision function for a status change. This is the heart of the domain.
 *
 * - same status        -> `noop`    (idempotent: must NOT create an audit log)
 * - exactly next status -> `valid`
 * - skip / backwards / leaving a terminal state -> `invalid`
 */
export function evaluateTransition(from: TaskStatus, to: TaskStatus): TransitionResult {
  if (from === to) {
    return { kind: 'noop' };
  }

  const allowed = nextStatus(from);
  if (allowed === to) {
    return { kind: 'valid', from, to };
  }

  const hint = allowed ? `"${allowed}"` : `none ("${from}" is the final status)`;
  return {
    kind: 'invalid',
    reason: `Illegal status transition "${from}" -> "${to}". The only allowed next status is ${hint}.`,
  };
}
