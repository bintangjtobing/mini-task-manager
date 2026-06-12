import type { AuditLog, Meta, Task, TaskStatus } from '../types';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api';

interface ApiErrorShape {
  error?: { code?: string; message?: string };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the API. Is the server running?');
  }

  if (!res.ok) {
    let payload: ApiErrorShape = {};
    try {
      payload = (await res.json()) as ApiErrorShape;
    } catch {
      // response had no JSON body
    }
    throw new ApiError(res.status, payload.error?.message ?? `Request failed (${res.status})`, payload.error?.code);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export const api = {
  getMeta: () => request<Meta>('/meta'),
  listTasks: () => request<Task[]>('/tasks'),
  createTask: (title: string, actor: string) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify({ title, actor }) }),
  updateStatus: (id: string, status: TaskStatus, actor: string) =>
    request<{ task: Task; changed: boolean }>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, actor }),
    }),
  deleteTask: (id: string, actor: string) =>
    request<{ ok: true }>(`/tasks/${id}`, { method: 'DELETE', body: JSON.stringify({ actor }) }),
  getAuditLogs: (id: string) => request<AuditLog[]>(`/tasks/${id}/audit-logs`),
};
