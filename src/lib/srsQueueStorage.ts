import { allKeys, BANK_EN } from "../data/bank";

/** Группа задания для SRS (совпадает с `SrsTaskGroup` в srsTrainPrefs) */
export type QueueSnapshotTaskGroup = "t1" | "t2" | "t3";

/** Режим очереди SRS (совпадает с `SrsTrainMode`) */
export type QueueSnapshotTrainMode = "due" | "all" | "problem";

export type QueueSessionSnapshot = {
  queue: string[];
  qi: number;
  /** С какими фильтрами сохранена очередь (нет в старых снимках) */
  group?: QueueSnapshotTaskGroup;
  mode?: QueueSnapshotTrainMode;
};

/** @deprecated используйте QueueSessionSnapshot */
export type SrsQueueSnapshot = QueueSessionSnapshot;

function isValidGroup(g: unknown): g is QueueSnapshotTaskGroup {
  return g === "t1" || g === "t2" || g === "t3";
}

function isValidMode(m: unknown): m is QueueSnapshotTrainMode {
  return m === "due" || m === "all" || m === "problem";
}

export function sanitizeQueueSnapshot(raw: unknown): QueueSessionSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const { queue: q, qi, group: gRaw, mode: mRaw } = raw as {
    queue?: unknown;
    qi?: unknown;
    group?: unknown;
    mode?: unknown;
  };
  if (!Array.isArray(q) || q.some((x) => typeof x !== "string")) return null;
  if (typeof qi !== "number" || !Number.isFinite(qi)) return null;
  const valid = new Set(allKeys(BANK_EN));
  const queue = q.filter((k) => valid.has(k));
  if (queue.length === 0) return null;
  const qiClamped = Math.min(Math.max(0, Math.floor(qi)), queue.length - 1);
  const group = isValidGroup(gRaw) ? gRaw : undefined;
  const mode = isValidMode(mRaw) ? mRaw : undefined;
  return { queue, qi: qiClamped, ...(group ? { group } : {}), ...(mode ? { mode } : {}) };
}

/** @deprecated используйте sanitizeQueueSnapshot */
export const sanitizeSrsSnapshot = sanitizeQueueSnapshot;

function createQueueStorage(lsKey: string) {
  return {
    lsKey,
    load(): QueueSessionSnapshot | null {
      try {
        const raw = localStorage.getItem(lsKey);
        if (!raw) return null;
        return sanitizeQueueSnapshot(JSON.parse(raw));
      } catch {
        return null;
      }
    },
    save(s: QueueSessionSnapshot): void {
      try {
        localStorage.setItem(lsKey, JSON.stringify(s));
      } catch {
        /* ignore */
      }
    },
    clear(): void {
      try {
        localStorage.removeItem(lsKey);
      } catch {
        /* ignore */
      }
    },
  };
}

export const SRS_QUEUE_LS_KEY = "angl-en-srs-queue-v1";
export const WEAK_QUEUE_LS_KEY = "angl-en-weak-queue-v1";

export const srsQueueStorage = createQueueStorage(SRS_QUEUE_LS_KEY);
export const weakQueueStorage = createQueueStorage(WEAK_QUEUE_LS_KEY);

export function loadSrsQueueSnapshot(): QueueSessionSnapshot | null {
  return srsQueueStorage.load();
}

export function saveSrsQueueSnapshot(s: QueueSessionSnapshot): void {
  srsQueueStorage.save(s);
}

export function clearSrsQueueSnapshot(): void {
  srsQueueStorage.clear();
}

export function loadWeakQueueSnapshot(): QueueSessionSnapshot | null {
  return weakQueueStorage.load();
}

export function saveWeakQueueSnapshot(s: QueueSessionSnapshot): void {
  weakQueueStorage.save(s);
}

export function clearWeakQueueSnapshot(): void {
  weakQueueStorage.clear();
}
