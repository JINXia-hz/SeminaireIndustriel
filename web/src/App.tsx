import { useEffect, useState } from 'react';
import { api, type Task } from './api.ts';
import { Board } from './components/Board.tsx';
import { NewTaskForm } from './components/NewTaskForm.tsx';

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .listTasks()
      .then(
        (data) => {
          if (!cancelled) setTasks(data);
        },
        (e: Error) => {
          if (!cancelled) setError(e.message);
        },
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(title: string) {
    const task = await api.createTask(title);
    setTasks((prev) => [...prev, task]);
  }

  return (
    <main className="app">
      <header className="app__header">
        <h1>Kanban Factory</h1>
        <NewTaskForm onCreate={handleCreate} />
      </header>
      {error && (
        <p role="alert" className="app__error">
          {error}
        </p>
      )}
      {loading ? <p aria-busy="true">Loading…</p> : <Board tasks={tasks} />}
    </main>
  );
}
