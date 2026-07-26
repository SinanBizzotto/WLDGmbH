const storageKey = (userId: string) => `wld-fitness-notifications-seen-v1:${userId}`;
const MAX_SEEN = 300;

export function getSeenIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function markSeen(userId: string, ids: string[]): void {
  if (!ids.length) return;
  const current = getSeenIds(userId);
  ids.forEach((id) => current.add(id));
  const trimmed = Array.from(current).slice(-MAX_SEEN);
  localStorage.setItem(storageKey(userId), JSON.stringify(trimmed));
}
