export interface RecentScan {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  grams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  lastUsedAt: string;
}

const MAX_RECENT = 8;
const storageKey = (userId: string) => `wld-fitness-recent-scans-v1:${userId}`;

export function getRecentScans(userId: string): RecentScan[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as RecentScan[]) : [];
  } catch {
    return [];
  }
}

/** Records a scan as the most recently used, deduped by barcode. */
export function recordRecentScan(userId: string, scan: RecentScan): RecentScan[] {
  const next = [
    scan,
    ...getRecentScans(userId).filter((item) => item.barcode !== scan.barcode),
  ].slice(0, MAX_RECENT);
  localStorage.setItem(storageKey(userId), JSON.stringify(next));
  return next;
}

export function removeRecentScan(userId: string, barcode: string): RecentScan[] {
  const next = getRecentScans(userId).filter((item) => item.barcode !== barcode);
  localStorage.setItem(storageKey(userId), JSON.stringify(next));
  return next;
}
