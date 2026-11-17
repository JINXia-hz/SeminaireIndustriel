import { randomUUID } from 'node:crypto';
import type { CreateTaskInput, Task } from './domain.ts';

/**
 * In-memory task repository.
 * Kept deliberately simple: one instance per running server.
 */
export class TaskStore {
  private tasks = new Map<string, Task>();

  constructor(seed: Array<Pick<Task, 'title' | 'status'>> = []) {
    for (const t of seed) this.insert(t.title, t.status);
  }

  list(): Task[] {
    return [...this.tasks.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  get(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  create(input: CreateTaskInput): Task {
    return this.insert(input.title, 'todo');
  }

  reset(seed: Array<Pick<Task, 'title' | 'status'>> = []): void {
    this.tasks.clear();
    for (const t of seed) this.insert(t.title, t.status);
  }

  private insert(title: string, status: Task['status']): Task {
    // Monotonic timestamps keep the ordering stable even when tasks are created in the same ms.
    const last = [...this.tasks.values()].at(-1);
    const now = Date.now();
    const ts = last ? Math.max(now, Date.parse(last.createdAt) + 1) : now;
    const task: Task = { id: randomUUID(), title, status, createdAt: new Date(ts).toISOString() };
    this.tasks.set(task.id, task);
    return task;
  }
}

export const DEFAULT_SEED: Array<Pick<Task, 'title' | 'status'>> = [
  { title: 'Read the practical instructions', status: 'done' },
  { title: 'Write the planner agent', status: 'doing' },
  { title: 'Build the software factory', status: 'todo' },
];
