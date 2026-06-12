import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { StatusBadge } from './StatusBadge';
import { UserBadge } from './UserBadge';
import type { AuditAction, AuditLog } from '../types';

const ACTION_LABEL: Record<AuditAction, string> = {
  created: 'Created',
  status_changed: 'Status changed',
  deleted: 'Deleted',
};

/** Human-readable date/time, e.g. "Jun 11, 2026, 7:58 PM" (viewer's locale). */
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** Renders the audit entry as a sentence with status and user shown as badges. */
function AuditMessage({ log }: { log: AuditLog }) {
  const user = <UserBadge name={log.actorName} />;
  const title = <span className="audit-task">“{log.taskTitle}”</span>;

  switch (log.action) {
    case 'created':
      return (
        <span className="audit-message">
          {user} created task {title} with status{' '}
          {log.toStatus && <StatusBadge status={log.toStatus} />}
        </span>
      );
    case 'status_changed':
      return (
        <span className="audit-message">
          {user} changed task {title} from{' '}
          {log.fromStatus && <StatusBadge status={log.fromStatus} />} to{' '}
          {log.toStatus && <StatusBadge status={log.toStatus} />}
        </span>
      );
    case 'deleted':
      return (
        <span className="audit-message">
          {user} deleted task {title} (was{' '}
          {log.fromStatus && <StatusBadge status={log.fromStatus} />})
        </span>
      );
  }
}

export function AuditLogPanel({ taskId, refreshKey }: { taskId: string; refreshKey?: string | number }) {
  const [logs, setLogs] = useState<AuditLog[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await api.getAuditLogs(taskId);
        if (active) {
          setLogs(data);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : 'Failed to load audit logs');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [taskId, refreshKey]);

  if (error) {
    return <p className="error">{error}</p>;
  }
  if (!logs) {
    return <p className="muted">Loading history…</p>;
  }
  if (logs.length === 0) {
    return <p className="muted">No history yet.</p>;
  }

  return (
    <ol className="audit-log">
      {logs.map((log) => (
        <li key={log.id} className="audit-item">
          <span className={`tag tag-${log.action}`}>{ACTION_LABEL[log.action]}</span>
          <AuditMessage log={log} />
          <time className="audit-time" dateTime={log.at}>
            {formatDateTime(log.at)}
          </time>
        </li>
      ))}
    </ol>
  );
}
