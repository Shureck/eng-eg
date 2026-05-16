import { useEffect, useState } from "react";

const LS_KEY = "angl-en-cheat-mnemonic-visible";

/** Показ цветной шпаргалки в SRS-тренировке (по умолчанию вкл.) */
export function useCheatMnemonicVisible(): [boolean, (v: boolean) => void] {
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) !== "0";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, visible ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [visible]);

  return [visible, setVisible];
}
