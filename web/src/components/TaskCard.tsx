import type { Task } from '../api.ts';

export function TaskCard({ task }: { task: Task }) {
  return (
    <article className="card" aria-label={task.title}>
      <h3 className="card__title">{task.title}</h3>
    </article>
  );
}
