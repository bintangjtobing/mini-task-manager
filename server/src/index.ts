import { createApp } from './app';
import { TaskService } from './services/taskService';
import { createJsonDatabase } from './persistence/database';
import { DB_FILE, HOST, PORT } from './config';
import { ensureSeeded } from './seed';

async function main(): Promise<void> {
  const db = createJsonDatabase(DB_FILE);
  const service = new TaskService(db);

  // Populate sample data the very first time the server runs (empty database).
  await ensureSeeded(db, service);

  const app = createApp(service);
  app.listen(PORT, HOST, () => {
    console.log(`Mini Task Manager API listening on http://${HOST}:${PORT}`);
    console.log(`Data file: ${DB_FILE}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
