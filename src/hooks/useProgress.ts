import { useCallback, useEffect, useState } from "react";
import { allKeys, BANK_EN } from "../data/bank";
import { db, defaultProgress, loadProgressMap } from "../lib/db";
import type { ProgressRow } from "../types";

export function useProgress() {
  const [map, setMap] = useState<Map<string, ProgressRow>>(new Map());
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const m = await loadProgressMap(allKeys(BANK_EN));
    setMap(m);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(async (row: ProgressRow) => {
    const qid = row.qid;
    setMap((prev) => {
      const merged = { ...defaultProgress(qid), ...prev.get(qid), ...row, qid };
      void db.progress.put(merged);
      return new Map(prev).set(qid, merged);
    });
  }, []);

  return { map, ready, save, refresh };
}
