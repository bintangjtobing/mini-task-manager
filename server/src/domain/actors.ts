export interface Actor {
  id: string;
  name: string;
}

/**
 * Hardcoded, predefined users. This app has no authentication, so the "actor"
 * who performs an action is chosen from this list (a dropdown on the frontend).
 * This is the single source of truth — the frontend fetches it via `GET /meta`.
 */
export const ACTORS: readonly Actor[] = [
  { id: 'john.doe', name: 'John Doe' },
  { id: 'jane.smith', name: 'Jane Smith' },
  { id: 'andi.pratama', name: 'Andi Pratama' },
  { id: 'siti.rahma', name: 'Siti Rahma' },
  { id: 'bintang.tobing', name: 'Bintang Tobing' },
  { id: 'johan.sutheja', name: 'Johan Sutheja' },
];

export const ACTOR_IDS: readonly string[] = ACTORS.map((actor) => actor.id);

export function isKnownActor(id: string): boolean {
  return ACTOR_IDS.includes(id);
}
