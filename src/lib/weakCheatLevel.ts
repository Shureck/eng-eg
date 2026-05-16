import { useEffect, useState } from "react";

const LS_KEY = "angl-en-weak-cheat-level";

/** Уровень подсказки в «Слабых местах»: выкл → только ключ → полная шпаргалка */
export type WeakCheatLevel = 0 | 1 | 2;

function parseStored(raw: string | null): WeakCheatLevel {
  if (raw === "0") return 0;
  if (raw === "1") return 1;
  if (raw === "2") return 2;
  return 2;
}

export function useWeakCheatLevel(): [WeakCheatLevel, (v: WeakCheatLevel) => void] {
  const [level, setLevel] = useState<WeakCheatLevel>(() => {
    try {
      return parseStored(localStorage.getItem(LS_KEY));
    } catch {
      return 2;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, String(level));
    } catch {
      /* ignore */
    }
  }, [level]);

  return [level, setLevel];
}
