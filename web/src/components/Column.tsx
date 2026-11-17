import type { Task, TaskStatus } from '../api.ts';
import { TaskCard } from './TaskCard.tsx';

interface Props {
  status: TaskStatus;
  title: string;
  tasks: Task[];
}

export function Column({ status, title, tasks }: Props) {
  const headingId = `column-${status}`;
  return (
    <section className="column" aria-labelledby={headingId}>
      <h2 id={headingId}>
        {title} <span className="column__count">({tasks.length})</span>
      </h2>
      {tasks.length === 0 ? (
        <p className="column__empty">No tasks</p>
      ) : (
        <ul className="column__list">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
