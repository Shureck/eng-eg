import { useCallback, useEffect, useState } from "react";
import type { ProgressRow } from "../types";
import { defaultProgress } from "./db";
import { keysForTaskKind } from "../data/bank";
import { isDue } from "./srs";

/** Часть экзамена / группа банка для SRS */
export type SrsTaskGroup = "t1" | "t2" | "t3";

/** Как собирать очередь внутри группы */
export type SrsTrainMode = "due" | "all" | "problem";

const LS_GROUP = "angl-en-srs-train-group-v1";
const LS_MODE = "angl-en-srs-train-mode-v1";
const LS_FILTERS_COLLAPSED = "angl-en-srs-filters-collapsed-v1";

export const SRS_TASK_GROUP_LABEL: Record<SrsTaskGroup, string> = {
  t1: "Задание 1 — выбор ответа",
  t2: "Задание 2 — соответствие",
  t3: "Задание 3 — порядок слов",
};

export const SRS_TRAIN_MODE_LABEL: Record<SrsTrainMode, string> = {
  due: "По расписанию SRS",
  all: "Все карточки группы",
  problem: "Проблемные в группе",
};

export const SRS_TRAIN_MODE_HINT: Record<SrsTrainMode, string> = {
  due: "Коробки 0 и 1 всегда доступны; коробка 2 — не раньше чем через 24 ч после показа; коробка 3 — через 72 ч.",
  all: "Вся выбранная группа, перемешано — для зачёта перед экзаменом.",
  problem: "Только карточки с ошибкой или отметкой «сложно» (новые без попыток сюда не входят).",
};

function parseGroup(s: string | null): SrsTaskGroup {
  if (s === "t2" || s === "t3") return s;
  return "t1";
}

function parseMode(s: string | null): SrsTrainMode {
  if (s === "all" || s === "problem") return s;
  return "due";
}

export function useSrsTrainPrefs() {
  const [group, setGroupState] = useState<SrsTaskGroup>(() => {
    try {
      return parseGroup(localStorage.getItem(LS_GROUP));
    } catch {
      return "t1";
    }
  });
  const [mode, setModeState] = useState<SrsTrainMode>(() => {
    try {
      return parseMode(localStorage.getItem(LS_MODE));
    } catch {
      return "due";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_GROUP, group);
    } catch {
      /* ignore */
    }
  }, [group]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_MODE, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  const setGroup = useCallback((g: SrsTaskGroup) => setGroupState(g), []);
  const setMode = useCallback((m: SrsTrainMode) => setModeState(m), []);

  return { group, setGroup, mode, setMode };
}

/** Свёрнута ли панель «группа + режим» на странице SRS */
export function useSrsFiltersPanelCollapsed(): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const v = localStorage.getItem(LS_FILTERS_COLLAPSED);
      if (v === null) return true;
      return v === "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_FILTERS_COLLAPSED, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  return [collapsed, toggle];
}

/** Пул ключей для SRS по группе и режиму */
export function buildSrsTrainPool(
  allKeysList: string[],
  map: Map<string, ProgressRow>,
  group: SrsTaskGroup,
  mode: SrsTrainMode,
  now: number,
): string[] {
  const scoped = keysForTaskKind(allKeysList, group);
  if (mode === "due") {
    return scoped.filter((k) => isDue(map.get(k) ?? defaultProgress(k), now));
  }
  if (mode === "all") {
    return [...scoped];
  }
  /** Не используем «коробка ≤ 1»: у новых карточек box 0, и тогда счётчик совпадал бы со всеми 150. */
  return scoped.filter((k) => {
    const r = map.get(k) ?? defaultProgress(k);
    return !!(r.wrongEver || r.hardFlag);
  });
}
