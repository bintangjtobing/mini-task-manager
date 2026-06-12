/** Initials for the avatar, e.g. "Bintang Tobing" -> "BT". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const chars = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2);
  return chars.toUpperCase();
}

/** Deterministic hue (0-359) derived from the name, so each user keeps a color. */
function hueFor(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360;
  }
  return hash;
}

export function UserBadge({ name }: { name: string }) {
  const hue = hueFor(name);
  const avatarStyle = {
    background: `linear-gradient(135deg, hsl(${hue} 75% 54%), hsl(${(hue + 40) % 360} 75% 46%))`,
  };
  return (
    <span className="user-badge">
      <span className="user-avatar" style={avatarStyle} aria-hidden="true">
        {initials(name)}
      </span>
      {name}
    </span>
  );
}
