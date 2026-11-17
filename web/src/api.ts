import type { Task } from '../../server/src/domain.ts';

export type { Task, TaskStatus } from '../../server/src/domain.ts';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body?.details?.[0]?.message ?? body?.error ?? res.statusText;
    throw new ApiError(res.status, message);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const api = {
  listTasks: () => http<Task[]>('/tasks'),
  createTask: (title: string) =>
    http<Task>('/tasks', { method: 'POST', body: JSON.stringify({ title }) }),
};
