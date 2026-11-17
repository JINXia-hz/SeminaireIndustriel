import { z } from 'zod';

export const TASK_STATUSES = ['todo', 'doing', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string; // ISO 8601
}

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title is too long (max 120)'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
