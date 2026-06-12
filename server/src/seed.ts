import { promises as fs } from 'node:fs';
import { createJsonDatabase, type Database } from './persistence/database';
import { TaskService } from './services/taskService';
import { DB_FILE } from './config';

type Step = 'pending' | 'in_progress' | 'done';

interface Move {
  /** Status to advance to (must be the next step in the linear flow). */
  to: Step;
  /** Actor who performs this move (often someone other than the creator). */
  by: string;
}

interface SeedSpec {
  title: string;
  /** Actor who creates the task. */
  createdBy: string;
  /** Ordered status changes, each possibly by a different actor. */
  moves?: Move[];
}

/**
 * Sample data designed so that every predefined user appears, with realistic
 * cross-user collaboration in the audit trail (one person creates a task,
 * another moves it forward) and a varied spread of final statuses.
 */
const SEED: SeedSpec[] = [
  {
    title: 'Prepare Q3 invoice for ACME',
    createdBy: 'john.doe',
    moves: [
      { to: 'pending', by: 'john.doe' },
      { to: 'in_progress', by: 'jane.smith' },
    ],
  },
  {
    title: 'Draft onboarding checklist',
    createdBy: 'jane.smith',
    moves: [{ to: 'pending', by: 'jane.smith' }],
  },
  {
    title: 'Fix login redirect bug',
    createdBy: 'andi.pratama',
    moves: [
      { to: 'pending', by: 'andi.pratama' },
      { to: 'in_progress', by: 'andi.pratama' },
      { to: 'done', by: 'siti.rahma' },
    ],
  },
  {
    title: 'Plan sprint retro agenda',
    createdBy: 'siti.rahma',
  },
  {
    title: 'Design dark theme for the dashboard',
    createdBy: 'bintang.tobing',
    moves: [
      { to: 'pending', by: 'bintang.tobing' },
      { to: 'in_progress', by: 'bintang.tobing' },
    ],
  },
  {
    title: 'Set up CI/CD pipeline',
    createdBy: 'johan.sutheja',
    moves: [
      { to: 'pending', by: 'johan.sutheja' },
      { to: 'in_progress', by: 'jane.smith' },
      { to: 'done', by: 'johan.sutheja' },
    ],
  },
  {
    title: 'Write API documentation',
    createdBy: 'bintang.tobing',
    moves: [{ to: 'pending', by: 'johan.sutheja' }],
  },
  {
    title: 'Review pull request #142',
    createdBy: 'johan.sutheja',
    moves: [{ to: 'pending', by: 'andi.pratama' }],
  },
];

/**
 * Seeds sample data by replaying real service calls, so the resulting tasks and
 * audit logs are guaranteed to be consistent and follow the status rules.
 */
export async function seed(service: TaskService): Promise<void> {
  for (const spec of SEED) {
    const task = await service.create({ title: spec.title, actor: spec.createdBy });
    for (const move of spec.moves ?? []) {
      await service.updateStatus(task.id, { status: move.to, actor: move.by });
    }
  }
}

/** Seed only when the database is completely empty (first run). */
export async function ensureSeeded(db: Database, service: TaskService): Promise<void> {
  const state = await db.read();
  if (state.tasks.length === 0 && state.auditLogs.length === 0) {
    await seed(service);
  }
}

/** CLI entry point: wipe the data file and reseed. Run with `npm run seed`. */
async function runCli(): Promise<void> {
  await fs.rm(DB_FILE, { force: true });
  const db = createJsonDatabase(DB_FILE);
  const service = new TaskService(db);
  await seed(service);
  console.log(`Seeded sample data into ${DB_FILE}`);
}

if (require.main === module) {
  runCli().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
