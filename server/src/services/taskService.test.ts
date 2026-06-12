import { beforeEach, describe, expect, it } from 'vitest';
import { TaskService } from './taskService';
import { createInMemoryDatabase, type Database } from '../persistence/database';
import { InvalidTransitionError, NotFoundError } from '../domain/errors';

describe('TaskService', () => {
  let db: Database;
  let service: TaskService;

  beforeEach(() => {
    db = createInMemoryDatabase();
    service = new TaskService(db);
  });

  it('creates a task in "to_do" and writes a single "created" audit log', async () => {
    const task = await service.create({ title: 'Write spec', actor: 'john.doe' });
    expect(task.status).toBe('to_do');
    expect(task.ownerId).toBe('john.doe');

    const logs = await service.auditLogs(task.id);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      action: 'created',
      fromStatus: null,
      toStatus: 'to_do',
      actor: 'john.doe',
      taskTitle: 'Write spec',
    });
  });

  it('records an audit log for each valid status change and keeps old logs', async () => {
    const task = await service.create({ title: 'Ship feature', actor: 'john.doe' });
    await service.updateStatus(task.id, { status: 'pending', actor: 'jane.smith' });
    const { changed } = await service.updateStatus(task.id, { status: 'in_progress', actor: 'andi.pratama' });

    expect(changed).toBe(true);

    const logs = await service.auditLogs(task.id);
    expect(logs.map((log) => log.action)).toEqual(['created', 'status_changed', 'status_changed']);
    expect(logs.map((log) => log.toStatus)).toEqual(['to_do', 'pending', 'in_progress']);
    expect(logs.map((log) => log.actor)).toEqual(['john.doe', 'jane.smith', 'andi.pratama']);
  });

  it('is idempotent: setting the same status creates no new audit log', async () => {
    const task = await service.create({ title: 'Idempotent', actor: 'john.doe' });
    await service.updateStatus(task.id, { status: 'pending', actor: 'john.doe' });
    const before = await service.auditLogs(task.id);

    const result = await service.updateStatus(task.id, { status: 'pending', actor: 'john.doe' });
    const after = await service.auditLogs(task.id);

    expect(result.changed).toBe(false);
    expect(result.task.status).toBe('pending');
    expect(after).toHaveLength(before.length);
  });

  it('rejects an illegal transition and leaves the task + logs untouched', async () => {
    const task = await service.create({ title: 'Illegal', actor: 'john.doe' });

    await expect(service.updateStatus(task.id, { status: 'done', actor: 'john.doe' })).rejects.toBeInstanceOf(
      InvalidTransitionError,
    );

    const [current] = await service.list();
    expect(current.status).toBe('to_do');
    expect(await service.auditLogs(task.id)).toHaveLength(1);
  });

  it('throws NotFoundError when updating an unknown task', async () => {
    await expect(
      service.updateStatus('does-not-exist', { status: 'pending', actor: 'john.doe' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('deletes the task but preserves its audit trail (logs are immutable)', async () => {
    const task = await service.create({ title: 'Delete me', actor: 'john.doe' });
    await service.updateStatus(task.id, { status: 'pending', actor: 'john.doe' });
    await service.remove(task.id, 'jane.smith');

    expect(await service.list()).toHaveLength(0);

    const logs = await service.auditLogs(task.id);
    expect(logs.map((log) => log.action)).toEqual(['created', 'status_changed', 'deleted']);
    expect(logs[logs.length - 1]).toMatchObject({
      action: 'deleted',
      fromStatus: 'pending',
      toStatus: null,
      actor: 'jane.smith',
    });
  });

  it('returns audit logs ordered chronologically by seq', async () => {
    const a = await service.create({ title: 'A', actor: 'john.doe' });
    const b = await service.create({ title: 'B', actor: 'john.doe' });
    await service.updateStatus(a.id, { status: 'pending', actor: 'john.doe' });
    await service.updateStatus(b.id, { status: 'pending', actor: 'john.doe' });
    await service.updateStatus(a.id, { status: 'in_progress', actor: 'john.doe' });

    const logsA = await service.auditLogs(a.id);
    const seqs = logsA.map((log) => log.seq);
    expect(seqs).toEqual([...seqs].sort((x, y) => x - y));
    expect(logsA.map((log) => log.action)).toEqual(['created', 'status_changed', 'status_changed']);
  });
});
