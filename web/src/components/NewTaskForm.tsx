import { useState, type FormEvent } from 'react';

interface Props {
  onCreate: (title: string) => Promise<void>;
}

export function NewTaskForm({ onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreate(title);
      setTitle('');
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="new-task" onSubmit={handleSubmit} aria-label="New task">
      <label htmlFor="new-task-title">Task title</label>
      <input
        id="new-task-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'new-task-error' : undefined}
      />
      <button type="submit" disabled={submitting}>
        Add task
      </button>
      {error && (
        <p id="new-task-error" role="alert" className="new-task__error">
          {error}
        </p>
      )}
    </form>
  );
}
