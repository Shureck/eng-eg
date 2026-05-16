import { allKeys, BANK_EN } from "../data/bank";

export const SRS_QUEUE_LS_KEY = "angl-en-srs-queue-v1";

export type SrsQueueSnapshot = { queue: string[]; qi: number };

export function sanitizeSrsSnapshot(raw: unknown): SrsQueueSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const { queue: q, qi } = raw as { queue?: unknown; qi?: unknown };
  if (!Array.isArray(q) || q.some((x) => typeof x !== "string")) return null;
  if (typeof qi !== "number" || !Number.isFinite(qi)) return null;
  const valid = new Set(allKeys(BANK_EN));
  const queue = q.filter((k) => valid.has(k));
  if (queue.length === 0) return null;
  const qiClamped = Math.min(Math.max(0, Math.floor(qi)), queue.length - 1);
  return { queue, qi: qiClamped };
}

export function loadSrsQueueSnapshot(): SrsQueueSnapshot | null {
  try {
    const raw = localStorage.getItem(SRS_QUEUE_LS_KEY);
    if (!raw) return null;
    return sanitizeSrsSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveSrsQueueSnapshot(s: SrsQueueSnapshot): void {
  try {
    localStorage.setItem(SRS_QUEUE_LS_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearSrsQueueSnapshot(): void {
  try {
    localStorage.removeItem(SRS_QUEUE_LS_KEY);
  } catch {
    /* ignore */
  }
}
