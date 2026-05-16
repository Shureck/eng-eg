import type { ProgressRow } from "../types";
import { db } from "./db";
import {
  sanitizeQueueSnapshot,
  srsQueueStorage,
  weakQueueStorage,
} from "./srsQueueStorage";
import { clearLearnIndex, loadLearnIndexRaw, saveLearnIndex } from "./learnProgress";

export const PROGRESS_BACKUP_VERSION = 2 as const;

export type ProgressBackupV2 = {
  version: typeof PROGRESS_BACKUP_VERSION;
  exportedAt: number;
  progress: ProgressRow[];
  /** SRS: очередь и номер текущей карточки */
  srsSession: { queue: string[]; qi: number } | null;
  /** Слабые места: очередь и позиция */
  weakSession: { queue: string[]; qi: number } | null;
  /** Обучение: индекс карточки (0-based) */
  learnIndex: number;
};

export async function buildProgressBackup(): Promise<ProgressBackupV2> {
  const rows = await db.progress.toArray();
  return {
    version: PROGRESS_BACKUP_VERSION,
    exportedAt: Date.now(),
    progress: rows,
    srsSession: srsQueueStorage.load(),
    weakSession: weakQueueStorage.load(),
    learnIndex: loadLearnIndexRaw(),
  };
}

function isProgressBackupV2(x: unknown): x is ProgressBackupV2 {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    o.version === PROGRESS_BACKUP_VERSION &&
    Array.isArray(o.progress) &&
    typeof o.exportedAt === "number"
  );
}

/**
 * Импорт из JSON. Поддерживает старый формат (массив ProgressRow) и v2-объект.
 * После вызова имеет смысл перезагрузить страницу, чтобы подтянуть состояние React.
 */
export async function importProgressBackup(text: string): Promise<{ format: "v1-array" | "v2"; progressRows: number }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Файл не является корректным JSON");
  }

  if (Array.isArray(parsed)) {
    const rows = parsed as ProgressRow[];
    await db.progress.clear();
    await db.progress.bulkPut(rows);
    return { format: "v1-array", progressRows: rows.length };
  }

  if (!isProgressBackupV2(parsed)) {
    throw new Error("Неизвестный формат: ожидается массив прогресса или объект версии 2");
  }

  const b = parsed;
  await db.progress.clear();
  await db.progress.bulkPut(b.progress);

  const srsOk = b.srsSession ? sanitizeQueueSnapshot(b.srsSession) : null;
  if (srsOk) srsQueueStorage.save(srsOk);
  else srsQueueStorage.clear();

  const weakOk = b.weakSession ? sanitizeQueueSnapshot(b.weakSession) : null;
  if (weakOk) weakQueueStorage.save(weakOk);
  else weakQueueStorage.clear();

  const li =
    typeof b.learnIndex === "number" && Number.isFinite(b.learnIndex) && b.learnIndex >= 0
      ? Math.floor(b.learnIndex)
      : 0;
  saveLearnIndex(li);

  return { format: "v2", progressRows: b.progress.length };
}

/** Полный сброс: IndexedDB + сохранённые очереди и позиция обучения */
export async function resetAllTrainerData(): Promise<void> {
  await db.progress.clear();
  srsQueueStorage.clear();
  weakQueueStorage.clear();
  clearLearnIndex();
}
