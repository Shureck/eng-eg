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
import { CheatMnemonicLine, QuestionKeyOnlyLine } from "../components/CheatMnemonicLine";
import { CardWithActionsRail } from "../components/CardWithActionsRail";
import { Type2View, emptyMap2, gradeType2 } from "../components/Type2View";
import { Type3View, gradeType3, initialOrder3 } from "../components/Type3View";
import { getCheatT1, getCheatT2, getCheatT3 } from "../data/lightningCheatSheet";
import { useWeakCheatLevel, type WeakCheatLevel } from "../lib/weakCheatLevel";
import { isDue, onCorrectWeak, onWrong } from "../lib/srs";
import { shuffle } from "../lib/shuffle";

export default function Weak() {
  const { bank, questionUiRussian } = useQuestionLang();
  const { map, ready, save } = useProgress();
  const [weakCheatLevel, setWeakCheatLevel] = useWeakCheatLevel();
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
        <div className="flex flex-wrap gap-2 justify-end items-center">
          <span className="text-sm text-slate-600 dark:text-slate-400 shrink-0">Шпаргалка:</span>
          <div
            className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden divide-x divide-slate-300 dark:divide-slate-600"
            role="group"
            aria-label="Уровень шпаргалки"
          >
            {(
              [
                [0, "Выкл"],
                [1, "Ключ"],
                [2, "Полная"],
              ] as const
            ).map(([lv, label]) => (
              <button
                key={lv}
                type="button"
                className={`min-h-touch px-2.5 sm:px-3 text-xs sm:text-sm transition-colors ${
                  weakCheatLevel === lv
                    ? "bg-sky-600 text-white font-medium"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
                aria-pressed={weakCheatLevel === lv}
                onClick={() => setWeakCheatLevel(lv as WeakCheatLevel)}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" className="min-h-touch px-3 rounded-lg border text-sm" onClick={rebuild}>
            Обновить список
          </button>
        </div>
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
        <CardWithActionsRail
          actions={
            <>
              {!reveal && (
                <button
                  type="button"
                  className="min-h-touch w-full px-4 rounded-xl bg-sky-600 text-white font-medium"
                  disabled={!pick}
                  onClick={() => setReveal(true)}
                >
                  Проверить
                </button>
              )}
              {reveal && (
                <button
                  type="button"
                  className="min-h-touch w-full px-4 rounded-xl bg-emerald-600 text-white font-medium"
                  onClick={() => void applySrs(pick === aq.data.correct)}
                >
                  Дальше
                </button>
              )}
            </>
          }
        >
          <Type1View
            q={aq.data}
            mode="train"
            showRu={!questionUiRussian}
            questionUiRussian={questionUiRussian}
            cheatMnemonic={weakCheatLevel >= 2 ? (getCheatT1(aq.data.id) ?? null) : null}
            questionKeyOnly={
              weakCheatLevel === 1 ? (getCheatT1(aq.data.id)?.hook?.trim() || null) : null
            }
            pick={pick}
            onPick={setPick}
            reveal={reveal}
          />
        </CardWithActionsRail>
      )}

      {aq?.kind === "t2" && (
        <CardWithActionsRail
          actions={
            <>
              {!reveal && (
                <button type="button" className="min-h-touch w-full px-4 rounded-xl bg-sky-600 text-white font-medium" onClick={() => setReveal(true)}>
                  Проверить
                </button>
              )}
              {reveal && (
                <button
                  type="button"
                  className="min-h-touch w-full px-4 rounded-xl bg-emerald-600 text-white font-medium"
                  onClick={() => void applySrs(gradeType2(aq.data, map2))}
                >
                  Дальше
                </button>
              )}
            </>
          }
        >
          {weakCheatLevel >= 2 &&
            (() => {
              const ch = getCheatT2(aq.data.id);
              return ch ? <CheatMnemonicLine dense className="mb-2" hook={ch.hook} answerKey={ch.answerKey} /> : null;
            })()}
          {weakCheatLevel === 1 &&
            (() => {
              const ch = getCheatT2(aq.data.id);
              return ch?.hook?.trim() ? <QuestionKeyOnlyLine dense hook={ch.hook} className="mb-2" /> : null;
            })()}
          <Type2View
            q={aq.data}
            map={map2}
            setMap={setMap2}
            showRu={!questionUiRussian}
            questionUiRussian={questionUiRussian}
            reveal={reveal}
            disabled={reveal}
          />
        </CardWithActionsRail>
      )}

      {aq?.kind === "t3" && (
        <CardWithActionsRail
          actions={
            <>
              {!reveal && (
                <button type="button" className="min-h-touch w-full px-3 rounded-lg border text-sm" onClick={() => setHint3(true)}>
                  Подсказка
                </button>
              )}
              {!reveal && (
                <button type="button" className="min-h-touch w-full px-4 rounded-xl bg-sky-600 text-white font-medium" onClick={() => setReveal(true)}>
                  Проверить
                </button>
              )}
              {reveal && (
                <button
                  type="button"
                  className="min-h-touch w-full px-4 rounded-xl bg-emerald-600 text-white font-medium"
                  onClick={() => void applySrs(gradeType3(aq.data, order3))}
                >
                  Дальше
                </button>
              )}
            </>
          }
        >
          {weakCheatLevel >= 2 &&
            (() => {
              const ch = getCheatT3(aq.data.id);
              return ch ? <CheatMnemonicLine dense className="mb-2" hook={ch.hook} answerKey={ch.answerKey} /> : null;
            })()}
          {weakCheatLevel === 1 &&
            (() => {
              const ch = getCheatT3(aq.data.id);
              return ch?.hook?.trim() ? <QuestionKeyOnlyLine dense hook={ch.hook} className="mb-2" /> : null;
            })()}
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
        </CardWithActionsRail>
      )}
    </div>
  );
}
