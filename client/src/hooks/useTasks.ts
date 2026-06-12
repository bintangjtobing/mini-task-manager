import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Actor, Task, TaskStatus } from '../types';

function toMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/**
 * Loads the task list + actor metadata and exposes the mutating actions.
 * After each mutation it re-fetches the list so the UI always reflects the
 * server's authoritative state (the server is the source of truth).
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setTasks(await api.listTasks());
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [meta, list] = await Promise.all([api.getMeta(), api.listTasks()]);
        setActors(meta.actors);
        setTasks(list);
      } catch (err) {
        setError(toMessage(err, 'Failed to load data. Is the API running?'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const createTask = useCallback(
    async (title: string, actor: string) => {
      await api.createTask(title, actor);
      await refresh();
    },
    [refresh],
  );

  const changeStatus = useCallback(
    async (id: string, status: TaskStatus, actor: string) => {
      await api.updateStatus(id, status, actor);
      await refresh();
    },
    [refresh],
  );

  const deleteTask = useCallback(
    async (id: string, actor: string) => {
      await api.deleteTask(id, actor);
      await refresh();
    },
    [refresh],
  );

  return { tasks, actors, loading, error, setError, createTask, changeStatus, deleteTask };
}
