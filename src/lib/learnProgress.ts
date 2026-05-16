/** Индекс карточки в режиме «Обучение» (0-based), синхронизируется с экспортом */

export const LEARN_IDX_LS_KEY = "angl-en-learn-idx-v1";

export function loadLearnIndexRaw(): number {
  try {
    const v = localStorage.getItem(LEARN_IDX_LS_KEY);
    if (v == null) return 0;
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function saveLearnIndex(n: number): void {
  try {
    localStorage.setItem(LEARN_IDX_LS_KEY, String(Math.max(0, Math.floor(n))));
  } catch {
    /* ignore */
  }
}

export function clearLearnIndex(): void {
  try {
    localStorage.removeItem(LEARN_IDX_LS_KEY);
  } catch {
    /* ignore */
  }
}
