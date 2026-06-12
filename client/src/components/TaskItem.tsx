import { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { UserBadge } from './UserBadge';
import { AuditLogPanel } from './AuditLogPanel';
import { nextStatus, STATUS_LABEL } from '../constants';
import type { Task, TaskStatus } from '../types';

interface Props {
  task: Task;
  busy: boolean;
  onAdvance: (id: string, to: TaskStatus) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, busy, onAdvance, onDelete }: Props) {
  const [showHistory, setShowHistory] = useState(false);
  const upcoming = nextStatus(task.status);
  const done = task.status === 'done';

  return (
    <li className={done ? 'task is-done' : 'task'}>
      <div className="task-row">
        <div className="task-main">
          <StatusBadge status={task.status} />
          <span className="task-title">{task.title}</span>
          <UserBadge name={task.ownerName} />
        </div>

        <div className="task-actions">
          {upcoming ? (
            <button className="btn btn-sm" disabled={busy} onClick={() => onAdvance(task.id, upcoming)}>
              Move to {STATUS_LABEL[upcoming]}
            </button>
          ) : (
            <span className="done-label">✓ Completed</span>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => setShowHistory((value) => !value)}>
            {showHistory ? 'Hide history' : 'History'}
          </button>
          <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => onDelete(task.id)}>
            Delete
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="task-history">
          <AuditLogPanel taskId={task.id} refreshKey={task.updatedAt} />
        </div>
      )}
    </li>
  );
}
