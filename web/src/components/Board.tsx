import type { Task, TaskStatus } from '../api.ts';
import { Column } from './Column.tsx';

const COLUMNS: Array<{ status: TaskStatus; title: string }> = [
  { status: 'todo', title: 'To do' },
  { status: 'doing', title: 'Doing' },
  { status: 'done', title: 'Done' },
];

export function Board({ tasks }: { tasks: Task[] }) {
  return (
    <div className="board">
      {COLUMNS.map((col) => (
        <Column
          key={col.status}
          status={col.status}
          title={col.title}
          tasks={tasks.filter((t) => t.status === col.status)}
        />
      ))}
    </div>
  );
}
