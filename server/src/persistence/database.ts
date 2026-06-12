import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AuditLog, Task } from '../domain/types';

export interface DbState {
  tasks: Task[];
  auditLogs: AuditLog[];
}

/**
 * Persistence abstraction. The service/domain layer depends only on this
 * interface, so the JSON-file store can be swapped for SQLite/Postgres later
 * without touching any business logic.
 *
 * `transaction` runs the mutator exclusively (serialized via a mutex) and
 * persists the result atomically. Because a task update and its audit-log
 * append happen inside the same transaction, the two can never drift out of
 * sync — even if two requests arrive at the same time.
 */
export interface Database {
  read(): Promise<DbState>;
  transaction<T>(mutator: (state: DbState) => T): Promise<T>;
}

function emptyState(): DbState {
  return { tasks: [], auditLogs: [] };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

/** A minimal promise-chain mutex so read-modify-write cycles never interleave. */
function createMutex() {
  let tail: Promise<unknown> = Promise.resolve();
  return function runExclusive<T>(fn: () => Promise<T> | T): Promise<T> {
    const run = tail.then(() => fn());
    // Keep the chain alive regardless of success/failure of the current task.
    tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
}

/**
 * In-memory implementation. Used by the unit tests and as a reference impl
 * proving the persistence layer is swappable.
 */
export function createInMemoryDatabase(initial: DbState = emptyState()): Database {
  let state = clone(initial);
  const lock = createMutex();

  return {
    async read() {
      return clone(state);
    },
    transaction(mutator) {
      return lock(() => {
        const draft = clone(state);
        const result = mutator(draft); // may throw -> state stays unchanged
        state = draft; // commit only on success
        return result;
      });
    },
  };
}

/**
 * JSON-file implementation with atomic writes (write to a temp file, then
 * rename over the target — rename is atomic on the same filesystem, so a crash
 * mid-write can never leave a half-written, corrupt data file).
 */
export function createJsonDatabase(filePath: string): Database {
  let state: DbState | null = null;
  const lock = createMutex();

  async function load(): Promise<DbState> {
    if (state) {
      return state;
    }
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<DbState>;
      state = { tasks: parsed.tasks ?? [], auditLogs: parsed.auditLogs ?? [] };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        state = emptyState();
      } else {
        throw err;
      }
    }
    return state;
  }

  async function persist(next: DbState): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(next, null, 2), 'utf8');
    await fs.rename(tmp, filePath);
  }

  return {
    async read() {
      return clone(await load());
    },
    transaction(mutator) {
      return lock(async () => {
        const current = await load();
        const draft = clone(current);
        const result = mutator(draft); // may throw -> nothing is persisted
        await persist(draft);
        state = draft; // commit in-memory copy only after a successful write
        return result;
      });
    },
  };
}
