import Dexie, { type Table } from "dexie";
import type { ProgressRow } from "../types";

export class TrainerDB extends Dexie {
  progress!: Table<ProgressRow, string>;

  constructor() {
    super("angl-en-trainer");
    this.version(1).stores({
      progress: "qid",
    });
  }
}

export const db = new TrainerDB();

export function defaultProgress(qid: string): ProgressRow {
  return {
    qid,
    box: 0,
    lastShown: 0,
    correctStreak: 0,
    totalAttempts: 0,
    totalCorrect: 0,
    wrongEver: false,
    hardFlag: false,
  };
}

export async function loadProgressMap(keys: string[]): Promise<Map<string, ProgressRow>> {
  const rows = await db.progress.bulkGet(keys);
  const m = new Map<string, ProgressRow>();
  keys.forEach((k, i) => {
    const stored = rows[i];
    // Старый импорт / частичная запись — всегда дополняем дефолтами
    m.set(k, { ...defaultProgress(k), ...stored, qid: k });
  });
  return m;
}

export async function upsertProgress(row: ProgressRow): Promise<void> {
  await db.progress.put(row);
}

export async function resetAllProgress(): Promise<void> {
  await db.progress.clear();
}
