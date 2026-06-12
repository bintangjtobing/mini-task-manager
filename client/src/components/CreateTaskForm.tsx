import { type FormEvent, useState } from 'react';

interface Props {
  disabled?: boolean;
  onCreate: (title: string) => Promise<void>;
}

export function CreateTaskForm({ disabled, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    setSubmitting(true);
    try {
      await onCreate(trimmed);
      setTitle('');
    } finally {
      setSubmitting(false);
    }
  }

  const busy = disabled || submitting;

  return (
    <form className="create-form" onSubmit={handleSubmit}>
      <input
        className="input"
        placeholder="New task title…"
        value={title}
        maxLength={200}
        disabled={busy}
        onChange={(event) => setTitle(event.target.value)}
        aria-label="New task title"
      />
      <button className="btn btn-primary" type="submit" disabled={busy || !title.trim()}>
        Add task
      </button>
    </form>
  );
}
