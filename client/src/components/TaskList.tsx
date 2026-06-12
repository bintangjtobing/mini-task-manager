import type { Task, TaskStatus } from '../types';
import { TaskItem } from './TaskItem';

interface Props {
  tasks: Task[];
  busyId: string | null;
  onAdvance: (id: string, to: TaskStatus) => void;
  onDelete: (id: string) => void;
}

export function TaskList({ tasks, busyId, onAdvance, onDelete }: Props) {
  if (tasks.length === 0) {
    return <p className="muted empty">No tasks yet. Create one above.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          busy={busyId === task.id}
          onAdvance={onAdvance}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
