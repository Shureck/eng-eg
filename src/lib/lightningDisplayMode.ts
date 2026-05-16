import { useEffect, useState } from "react";

const LS_KEY = "angl-en-lightning-display";

/** Молниеносный режим: классический список «вопрос → ответ» или цветная мнемоника */
export type LightningDisplayMode = "standard" | "mnemonic";

export function useLightningDisplayMode(): [LightningDisplayMode, (v: LightningDisplayMode) => void] {
  const [mode, setMode] = useState<LightningDisplayMode>(() => {
    try {
      return localStorage.getItem(LS_KEY) === "mnemonic" ? "mnemonic" : "standard";
    } catch {
      return "standard";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  return [mode, setMode];
}
