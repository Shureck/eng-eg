import { useCallback, useEffect, useMemo, useState } from "react";
import { allKeys, BANK_EN, getQuestion } from "../data/bank";
import { useQuestionLang } from "../context/QuestionLangContext";
import { useProgress } from "../hooks/useProgress";
import { defaultProgress } from "../lib/db";
import {
  clearWeakQueueSnapshot,
  loadWeakQueueSnapshot,
  saveWeakQueueSnapshot,
} from "../lib/srsQueueStorage";
import { Type1View } from "../components/Type1View";
import { Type2View, emptyMap2, gradeType2 } from "../components/Type2View";
import { Type3View, gradeType3, initialOrder3 } from "../components/Type3View";
import { isDue, onCorrectWeak, onWrong } from "../lib/srs";
import { shuffle } from "../lib/shuffle";

export default function Weak() {
  const { bank, questionUiRussian } = useQuestionLang();
  const { map, ready, save } = useProgress();
  const [queue, setQueue] = useState<string[]>([]);
  const [qi, setQi] = useState(0);
  const [weakBootstrapped, setWeakBootstrapped] = useState(false);

  const rebuild = useCallback(() => {
    const now = Date.now();
    const due = shuffle(
      allKeys(BANK_EN).filter((k) => {
        const r = map.get(k) ?? defaultProgress(k);
        return (r.wrongEver || r.hardFlag) && isDue(r, now);
      }),
    );
    setQueue(due);
    setQi(0);
  }, [map]);

  useEffect(() => {
    if (!ready || weakBootstrapped) return;
    const snap = loadWeakQueueSnapshot();
    if (snap) {
      setQueue(snap.queue);
      setQi(snap.qi);
    } else {
      rebuild();
    }
    setWeakBootstrapped(true);
  }, [ready, weakBootstrapped, rebuild]);

  useEffect(() => {
    if (!ready || !weakBootstrapped) return;
    if (queue.length === 0) {
      clearWeakQueueSnapshot();
      return;
    }
    saveWeakQueueSnapshot({ queue, qi });
  }, [ready, weakBootstrapped, queue, qi]);

  const key = queue[qi];
  const aq = useMemo(() => (key ? getQuestion(key, bank) : null), [key, bank]);

  const [pick, setPick] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [map2, setMap2] = useState<Record<string, number>>({});
  const [order3, setOrder3] = useState<string[]>([]);
  const [hint3, setHint3] = useState(false);

  useEffect(() => {
    setPick(null);
    setReveal(false);
    setHint3(false);
    if (aq?.kind === "t2") setMap2(emptyMap2(aq.data));
    if (aq?.kind === "t3") setOrder3(initialOrder3(aq.data));
  }, [aq]);

  async function applySrs(correct: boolean) {
    if (!key) return;
    const row = map.get(key) ?? defaultProgress(key);
    const now = Date.now();
    await save(correct ? onCorrectWeak(row, now) : onWrong(row, now));

    if (correct) {
      const newQueue = queue.filter((k) => k !== key);
      const newQi = Math.min(qi, Math.max(0, newQueue.length - 1));
      setQueue(newQueue);
      setQi(newQi);
      if (newQueue.length === 0) rebuild();
      return;
    }

    if (qi + 1 >= queue.length) rebuild();
    else setQi((x) => x + 1);
  }

  const weakStats = useMemo(() => {
    const now = Date.now();
    let markedWeak = 0;
    let dueNow = 0;
    for (const k of allKeys(BANK_EN)) {
      const r = map.get(k) ?? defaultProgress(k);
      if (r.wrongEver || r.hardFlag) {
        markedWeak++;
        if (isDue(r, now)) dueNow++;
      }
    }
    return { markedWeak, dueNow };
  }, [map]);

  if (!ready) return <p className="text-slate-500">Загрузка…</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between flex-wrap gap-2 items-center">
        <h1 className="text-xl font-bold">Слабые места</h1>
        <button type="button" className="min-h-touch px-3 rounded-lg border text-sm" onClick={rebuild}>
          Обновить список
        </button>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Всего помечено слабыми: <strong>{weakStats.markedWeak}</strong>
        {" · "}
        К повторению по SRS сейчас: <strong>{weakStats.dueNow}</strong>
        {queue.length > 0 && (
          <>
            {" · "}
            Карточка <strong>{qi + 1}</strong> из <strong>{queue.length}</strong>
          </>
        )}
      </p>

      {!key && (
        <p className="text-emerald-700 dark:text-emerald-400">
          Отлично: нет ошибочных или всё уже повторено по графику SRS.
        </p>
      )}

      {aq?.kind === "t1" && (
        <>
          <Type1View
            q={aq.data}
            mode="train"
            showRu={!questionUiRussian}
            questionUiRussian={questionUiRussian}
            pick={pick}
            onPick={setPick}
            reveal={reveal}
          />
          {!reveal && (
            <button type="button" className="min-h-touch px-4 rounded-xl bg-sky-600 text-white font-medium" disabled={!pick} onClick={() => setReveal(true)}>
              Проверить
            </button>
          )}
          {reveal && (
            <button
              type="button"
              className="min-h-touch px-4 rounded-xl bg-emerald-600 text-white font-medium"
              onClick={() => void applySrs(pick === aq.data.correct)}
            >
              Дальше
            </button>
          )}
        </>
      )}

      {aq?.kind === "t2" && (
        <>
          <Type2View
            q={aq.data}
            map={map2}
            setMap={setMap2}
            showRu={!questionUiRussian}
            questionUiRussian={questionUiRussian}
            reveal={reveal}
            disabled={reveal}
          />
          {!reveal && (
            <button type="button" className="min-h-touch px-4 rounded-xl bg-sky-600 text-white font-medium" onClick={() => setReveal(true)}>
              Проверить
            </button>
          )}
          {reveal && (
            <button
              type="button"
              className="min-h-touch px-4 rounded-xl bg-emerald-600 text-white font-medium"
              onClick={() => void applySrs(gradeType2(aq.data, map2))}
            >
              Дальше
            </button>
          )}
        </>
      )}

      {aq?.kind === "t3" && (
        <>
          {!reveal && (
            <button type="button" className="min-h-touch px-3 rounded-lg border text-sm mb-2" onClick={() => setHint3(true)}>
              Подсказка
            </button>
          )}
          <Type3View
            q={aq.data}
            order={order3}
            setOrder={setOrder3}
            showRu={!questionUiRussian}
            questionUiRussian={questionUiRussian}
            reveal={reveal}
            disabled={reveal}
            showHint={hint3}
          />
          {!reveal && (
            <button type="button" className="min-h-touch px-4 rounded-xl bg-sky-600 text-white font-medium" onClick={() => setReveal(true)}>
              Проверить
            </button>
          )}
          {reveal && (
            <button
              type="button"
              className="min-h-touch px-4 rounded-xl bg-emerald-600 text-white font-medium"
              onClick={() => void applySrs(gradeType3(aq.data, order3))}
            >
              Дальше
            </button>
          )}
        </>
      )}
    </div>
  );
}
