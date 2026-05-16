import type { ProgressRow } from "../types";

const H24 = 24 * 3600 * 1000;
const H72 = 72 * 3600 * 1000;

/** Коробка SRS: 0–1 каждую сессию; 2 через 24ч; 3 через 72ч */
function normBox(row: ProgressRow): number {
  const b = row.box;
  return typeof b === "number" && !Number.isNaN(b) ? b : 0;
}

export function isDue(row: ProgressRow, now: number): boolean {
  const box = normBox(row);
  if (box <= 1) return true;
  if (box === 2) return now - (row.lastShown ?? 0) >= H24;
  if (box === 3) return now - (row.lastShown ?? 0) >= H72;
  return true;
}

export function onCorrect(row: ProgressRow, now: number): ProgressRow {
  const box = Math.min(3, normBox(row) + 1);
  return {
    ...row,
    box: Math.max(1, box),
    lastShown: now,
    correctStreak: (row.correctStreak ?? 0) + 1,
    totalAttempts: (row.totalAttempts ?? 0) + 1,
    totalCorrect: (row.totalCorrect ?? 0) + 1,
  };
}

export function onWrong(row: ProgressRow, now: number): ProgressRow {
  return {
    ...row,
    box: 1,
    lastShown: now,
    correctStreak: 0,
    totalAttempts: (row.totalAttempts ?? 0) + 1,
    wrongEver: true,
  };
}

export function markHard(row: ProgressRow): ProgressRow {
  return { ...row, hardFlag: true };
}

export function boxStats(rows: (ProgressRow | undefined)[]): Record<number, number> {
  const c: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const r of rows) {
    const raw = r?.box;
    const b = Math.min(3, Math.max(0, typeof raw === "number" && !Number.isNaN(raw) ? raw : 0));
    c[b] = (c[b] ?? 0) + 1;
  }
  return c;
}
