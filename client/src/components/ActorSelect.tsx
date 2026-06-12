import type { Actor } from '../types';
import { ALL_USERS } from '../constants';

interface Props {
  actors: Actor[];
  value: string;
  onChange: (id: string) => void;
  id?: string;
  disabled?: boolean;
  /** When true, prepends a "🌐 All users" option (value = ALL_USERS). */
  includeAll?: boolean;
}

export function ActorSelect({ actors, value, onChange, id, disabled, includeAll }: Props) {
  return (
    <select
      id={id}
      className="select"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      {includeAll && <option value={ALL_USERS}>🌐 All users</option>}
      {actors.map((actor) => (
        <option key={actor.id} value={actor.id}>
          {actor.name}
        </option>
      ))}
    </select>
  );
}
