import { Fragment, useState } from 'react';
import { useTasks } from './hooks/useTasks';
import { CreateTaskForm } from './components/CreateTaskForm';
import { TaskList } from './components/TaskList';
import { ActorSelect } from './components/ActorSelect';
import { StatusBadge } from './components/StatusBadge';
import { UserBadge } from './components/UserBadge';
import { STATUS_ORDER, ALL_USERS } from './constants';
import { ApiError } from './api/client';
import type { TaskStatus } from './types';

export default function App() {
  const { tasks, actors, loading, error, setError, createTask, changeStatus, deleteTask } = useTasks();
  const [viewId, setViewId] = useState<string>(ALL_USERS);
  const [globalActorId, setGlobalActorId] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const isGlobal = viewId === ALL_USERS;
  const fallbackActor = actors[0]?.id ?? '';
  // Who performs actions: in the global view it's the dedicated "Acting as"
  // picker; when viewing one person's board it's that same person.
  const actor = isGlobal ? globalActorId || fallbackActor : viewId || fallbackActor;
  const actorName = actors.find((a) => a.id === actor)?.name ?? '';
  const viewedName = actors.find((a) => a.id === viewId)?.name ?? '';

  // Tasks are owned by their creator; a specific view shows only that owner's tasks.
  const visibleTasks = isGlobal ? tasks : tasks.filter((task) => task.ownerId === viewId);

  function reportError(err: unknown, fallback: string) {
    setError(err instanceof ApiError ? err.message : fallback);
  }

  async function handleCreate(title: string) {
    setError(null);
    try {
      await createTask(title, actor);
    } catch (err) {
      reportError(err, 'Failed to create task');
    }
  }

  async function runTaskAction(id: string, action: () => Promise<void>, fallback: string) {
    setBusyId(id);
    setError(null);
    try {
      await action();
    } catch (err) {
      reportError(err, fallback);
    } finally {
      setBusyId(null);
    }
  }

  function handleAdvance(id: string, to: TaskStatus) {
    void runTaskAction(id, () => changeStatus(id, to, actor), 'Failed to update status');
  }

  function handleDelete(id: string) {
    if (!window.confirm('Delete this task? Its audit history will be kept.')) {
      return;
    }
    void runTaskAction(id, () => deleteTask(id, actor), 'Failed to delete task');
  }

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <img className="brand-logo" src="/qonflo-logo.svg" alt="Qonflo" />
          <span className="brand-divider" />
          <div>
            <div className="brand-title">Mini Task Manager</div>
            <div className="brand-sub">Task workflow with an immutable audit trail</div>
          </div>
        </div>
        <div className="controls">
          <div className="control">
            <label htmlFor="view">Viewing</label>
            <ActorSelect id="view" actors={actors} value={viewId} includeAll disabled={loading} onChange={setViewId} />
          </div>
          {isGlobal && (
            <div className="control">
              <label htmlFor="actor">Acting as</label>
              <ActorSelect id="actor" actors={actors} value={actor} disabled={loading} onChange={setGlobalActorId} />
            </div>
          )}
        </div>
      </header>

      <main className="app">
        <div className="page-head">
          <h1>Task board</h1>
          <div className="flow">
            {STATUS_ORDER.map((status, index) => (
              <Fragment key={status}>
                {index > 0 && <span className="flow-arrow">→</span>}
                <StatusBadge status={status} />
              </Fragment>
            ))}
          </div>
        </div>

        {error && <div className="banner banner-error">⚠ {error}</div>}

        <div className="create-card">
          <CreateTaskForm disabled={loading || !actor} onCreate={handleCreate} />
          {actor && (
            <p className="create-hint">
              New task will be owned by <UserBadge name={actorName} />
            </p>
          )}
        </div>

        <div className="list-head">
          <h2>{isGlobal ? 'All tasks' : `${viewedName}'s tasks`}</h2>
          <span className="count">{visibleTasks.length}</span>
        </div>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <TaskList tasks={visibleTasks} busyId={busyId} onAdvance={handleAdvance} onDelete={handleDelete} />
        )}
      </main>
    </>
  );
}
